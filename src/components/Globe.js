import * as d3 from "npm:d3";
import * as topojson from "npm:topojson-client";

export class Globe {
  // 1. Add config as the 4th parameter
  constructor(data, containing, svg, config) {
    this.data       = data;
    this.containing = containing;
    this.svg        = svg;
    
    // 2. Extract the variables from config and attach them to "this"
    this.preview   = config.preview;
    this.variables = config.variables;
    this.TOPO      = config.TOPO;
    this.GLOBE     = config.GLOBE;

    this.hovered    = null;
    this.selected   = null;
    this._onSelect  = () => {};

    // 3. Update all references to use this.preview and this.variables
    this.projection = d3.geoOrthographic()
      .scale(this.variables.globe.radius)
      .translate([this.preview.width / 2, this.preview.height / 2])
      .rotate(this.variables.globe.start)
      .clipAngle(90);

    this.path = d3.geoPath().projection(this.projection);

    this.view = this.containing.append('g')
      .attr('clip-path', 'url(#globe-clip)');

    this.view.append('circle')
      .attr('cx', this.preview.width / 2)
      .attr('cy', this.preview.height / 2)
      .attr('r', this.variables.globe.radius)
      .attr('fill', this.variables.globe.colors.ocean);

    this.graticule = this.view.append('path')
      .datum(d3.geoGraticule()())
      .attr('fill', 'none')
      .attr('stroke', this.variables.globe.colors.graticule)
      .attr('stroke-width', this.variables.globe.stroke.graticule);

    this.countries = this.view.append('g');

    this.borders = this.view.append('path')
      .attr('fill', 'none')
      .attr('stroke', this.variables.globe.colors.borders)
      .attr('stroke-width', this.variables.globe.stroke.borders);

    this.containing.append('circle')
      .attr('cx', this.preview.width / 2)
      .attr('cy', this.preview.height / 2)
      .attr('r', this.variables.globe.radius + this.variables.globe.stroke.outline / 2)
      .attr('fill', 'none')
      .attr('stroke', this.variables.globe.colors.atmosphere)
      .attr('stroke-width', this.variables.globe.stroke.outline)
      .attr('stroke-opacity', this.variables.globe.stroke.opacity);

    this.scale = d3.scaleLinear()
      .domain(this.variables.rays.scale.domain)
      .range(this.variables.globe.colors.scale);

    this._lowRes = {
      countries: topojson.feature(this.TOPO.high, this.TOPO.high.objects.countries),
      borders: topojson.mesh(this.TOPO.high, this.TOPO.high.objects.countries, (a, b) => a !== b)
    };

    this._highRes = {
      countries: topojson.feature(this.TOPO.low, this.TOPO.low.objects.countries),
      borders: topojson.mesh(this.TOPO.low, this.TOPO.low.objects.countries, (a, b) => a !== b)
    };

    this._resTimer = null;
    this.selection = false;
    this._reticuleEl = null;

    this._tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "rgba(0,0,0,0.75)")
      .style("color", "#fff")
      .style("padding", "4px 8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  }

  onSelect(callback) {
    this._onSelect = callback;
    return this;
  }

  snapResolution() {
    clearTimeout(this._resTimer);
    this._resTimer = setTimeout(() => {
      this.GLOBE.countries = this._highRes.countries;
      this.GLOBE.borders   = this._highRes.borders;
      this.render();
    }, 10);
  }

  reticule(k = 1) {
    if (!this.selection) return;

    if (!this._reticuleEl) {
      this._reticuleEl = this.svg.append('circle')
        .attr('cx', this.preview.width / 2)
        .attr('cy', this.preview.height / 2)
        .attr('fill', 'none')
        .attr('stroke', '#CC0000')
        .attr('stroke-width', this.variables.globe.stroke.outline)
        .attr('stroke-opacity', this.variables.globe.stroke.opacity);
    }

    const base = this.variables.globe.radius + this.variables.globe.stroke.outline / 2;
    this._reticuleEl.attr('r', base / k);
  }

  contained() {
    if (!this.selection || !this._reticuleEl) return [];

    const k    = this.svg.node().__zoom?.k ?? 1;
    const base = this.variables.globe.radius + this.variables.globe.stroke.outline / 2;
    const r    = base / (k * k);

    const cx = this.preview.width / 2;
    const cy = this.preview.height / 2;

    return this.GLOBE.countries.features
      .filter(d => {
        if (!this.visible(d)) return false;

        const centroid = this.path.centroid(d);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) return false;

        const dx = centroid[0] - cx;
        const dy = centroid[1] - cy;

        return Math.sqrt(dx * dx + dy * dy) <= r;
      })
      .map(d => d.properties.name);
  }

  visible(feature) {
    if (!feature.geometry) return false;

    const center = this.projection.invert([
      this.preview.width / 2,
      this.preview.height / 2
    ]);

    function coordinates(polygon) {
      const coords = feature.geometry.type === 'MultiPolygon'
        ? polygon[0]
        : polygon;

      return coords.some(coord => d3.geoDistance(coord, center) < Math.PI / 2);
    }

    return feature.geometry.coordinates.some(coordinates);
  }

  scroll() {
    this.svg.node().addEventListener("wheel", evt => {
      if (evt.ctrlKey) return;

      evt.preventDefault();

      this.GLOBE.countries = this._lowRes.countries;
      this.GLOBE.borders   = this._lowRes.borders;

      this.variables.globe.start[0] -= evt.deltaX * 0.3;
      this.variables.globe.start[1] += evt.deltaY * 0.3;
      this.variables.globe.start[1] = Math.max(
        -90,
        Math.min(90, this.variables.globe.start[1])
      );

      this.projection.rotate(this.variables.globe.start);
      this.render();
      this.snapResolution();
    }, { passive: false });
  }

  zoom(extraFilter) {
    this._prevK    = 1;
    this._atFloor  = false;
    this._prevDist = null;

    this.zooming = d3.zoom()
      .scaleExtent([0.1, 4])
      .clickDistance(4)
      .filter(evt => {
        if (evt.type === "dblclick") return false;
        if (evt.type === "mousedown") return false;
        if (evt.type === "wheel" && !evt.ctrlKey) return false;
        if (evt.type === "click") return false;
        if (extraFilter && !extraFilter(evt)) return false;
        return true;
      })
      .on("zoom", evt => {
        const k  = evt.transform.k;
        const tx = (this.preview.width / 2) * (1 - k);
        const ty = (this.preview.height / 2) * (1 - k);

        this.containing.attr(
          'transform',
          `translate(${tx},${ty}) scale(${k})`
        );

        let pinchingIn  = k < this._prevK;
        let pinchingOut = k > this._prevK;

        const src = evt.sourceEvent;

        if (src?.touches?.length === 2) {
          const dx = src.touches[0].clientX - src.touches[1].clientX;
          const dy = src.touches[0].clientY - src.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (this._prevDist !== null) {
            pinchingIn  = dist < this._prevDist;
            pinchingOut = dist > this._prevDist;
          }

          this._prevDist = dist;
        } else {
          this._prevDist = null;
        }

        this.GLOBE.countries = this._lowRes.countries;
        this.GLOBE.borders   = this._lowRes.borders;

        if (pinchingOut && this._atFloor) {
          this._atFloor = false;
        }

        if (!this.selection && !this.selected && pinchingIn) {
          if (k < 1) {
            this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
          }

          this._prevK = 1;
          return;
        }

        if (!this.selection && !this.selected && pinchingOut) {
          this.selection = true;
          this._atFloor  = false;

          this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
          this._prevK = 1;

          this.render();
          this.snapResolution();
          return;
        }

        if (this.selection && pinchingIn) {
          if (this._atFloor) {
            this.selection = false;
            this._atFloor  = false;

            if (this._reticuleEl) {
              this._reticuleEl.remove();
              this._reticuleEl = null;
            }

            if (k < 1) {
              this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
            }

            this._prevK = 1;
            this.render();
            this.snapResolution();
            return;
          }

          if (k <= 1) {
            this._atFloor = true;

            if (k < 1) {
              this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
            }

            this._prevK = 1;
            this.render();
            this.snapResolution();
            return;
          }
        }

        this._prevK = k;
        this.render();
        this.snapResolution();
      });

    this.svg.call(this.zooming);
  }

  interactivity({ scroll = true, zoom = true, reset = true, onReset, zoomFilter } = {}) {
    if (scroll) this.scroll();
    if (zoom)   this.zoom(zoomFilter);
    if (reset)  this.reset(onReset);
  }

  reset(onReset) {
    this.svg.node().addEventListener("dblclick", () => {
      this.selected  = null;
      this.selection = false;

      if (this._reticuleEl) {
        this._reticuleEl.remove();
        this._reticuleEl = null;
      }

      this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
      this._prevK = 1;

      this._onSelect(null);

      if (onReset) onReset();

      this.render();
    });
  }

  render(onHover) {
    this._onHover = onHover || this._onHover || (() => {});

    const k = this.svg.node().__zoom?.k ?? 1;
    this.reticule(k);

    this.countries.selectAll('path')
      .data(this.GLOBE.countries.features)
      .join(
        enter => enter.append('path')
          .on('mouseover', (evt, d) => {
            this.hovered = d;
            this._tooltip.style("opacity", 1).html(d.properties.name);
            this.render();
            this._onHover(d);
          })
          .on('mousemove', evt => {
            this._tooltip
              .style("left", `${evt.pageX + 12}px`)
              .style("top", `${evt.pageY - 28}px`);
          })
          .on('mouseout', () => {
            this.hovered = null;
            this._tooltip.style("opacity", 0);
            this.render();
            this._onHover(null);
          })
          .on('click', (evt, d) => {
            this.selected  = d;
            this.selection = false;

            if (this._reticuleEl) {
              this._reticuleEl.remove();
              this._reticuleEl = null;
            }

            this._tooltip.style("opacity", 0);
            this.svg.call(this.zooming.transform, d3.zoomIdentity.scale(1));
            this._prevK = 1;

            this._onSelect(d);
          })
      )
      .attr('d', d => this.path(d))
      .attr('fill', d => {
        const match = this.data.find(item => item.name === d.properties.name);
        return match ? this.scale(match.score) : this.variables.globe.colors.land;
      })
      .attr('stroke', d => {
        if (d === this.selected) return this.variables.globe.colors.selected;
        if (d === this.hovered)  return this.variables.globe.colors.hovered;
        return 'none';
      })
      .attr('stroke-width', d => d === this.selected ? 2 : 1.5);

    this.graticule.attr('d', this.path(d3.geoGraticule()()));
    this.borders.attr('d', this.path(this.GLOBE.borders));

    this.contained();
    this._onHover(this.hovered);
  }
}