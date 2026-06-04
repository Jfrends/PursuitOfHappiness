import * as d3 from "npm:d3";
import { Scales } from "./Scales.js"; // <--- ADD THIS LINE

export class Rays {
  // 1. Add config to the constructor
  constructor(data, containing, globe, onRender, config) {
    this.data = data;
    this.containing = containing;
    this.globe = globe;
    this.hovered = null;

    // 2. Bind the config properties to this class instance
    this.preview   = config.preview;
    this.variables = config.variables;
    this.GLOBE     = config.GLOBE;

    // 3. IMPORTANT: Pass config down to the child Scales class!
    this.scale = new Scales(this.data, this.containing, {
      radials: false,
      initGesture: false,
      onYearClick: y => globe._graph.setYear(y)
    }, config); 

    this.view = this.containing.append('g');
    this.errors = this.containing.append('g');
    this.onRender = onRender || (() => {});
  }

  visible(item) {
    // 4. Update GLOBE reference
    const feature = this.GLOBE.countries.features.find(f => f.properties.name === item.name);
    return feature ? this.globe.visible(feature) : false;
  }

  ray(d, i, pie, contained) {
    const item  = this.data[i];
    const pad   = d.padAngle / 2;
    const ray   = { start: d.startAngle + pad, end: d.endAngle - pad };
    const mid   = (ray.start + ray.end) / 2;
    const tip   = this.scale.scale(item.score);
    const large = (ray.end - ray.start) > Math.PI ? 1 : 0;
    
    // 4. Update variables reference
    const r     = this.variables.rays.radius.inner;

    // 4. Update preview references
    const triangle = {
      base: {
        left:  [(this.preview.width/2) + Math.sin(ray.start)*r, (this.preview.height/2) - Math.cos(ray.start)*r],
        right: [(this.preview.width/2) + Math.sin(ray.end)*r,   (this.preview.height/2) - Math.cos(ray.end)*r]
      },
      tip: [(this.preview.width/2) + Math.sin(mid)*tip, (this.preview.height/2) - Math.cos(mid)*tip]
    };

    const isContained    = contained.includes(item.name);
    const isGlobeHovered = this.globe.hovered && item.name === this.globe.hovered.properties.name;
    const isHovered      = this.hovered === i || isGlobeHovered;
    const active         = this.globe.selection ? isContained : this.visible(item);
    
    // 4. Update variables references
    const colors         = active ? this.variables.rays.colors.rays.active : this.variables.rays.colors.rays.inactive;
    const fill           = isHovered ? this.variables.rays.colors.hovered : colors[i % colors.length];

    this.view.append('path')
      .attr('d', `M ${triangle.base.left} A ${r},${r} 0 ${large},1 ${triangle.base.right} L ${triangle.tip} Z`)
      .attr('fill', fill)
      // 4. Update variables references
      .attr('stroke-width', this.variables.rays.stroke.rays.width)
      .attr('stroke-opacity', this.variables.rays.stroke.rays.opacity)
      .attr('fill-opacity', this.variables.rays.stroke.rays.fill)
      .on('mouseover', () => { this.hovered = i; this.render(pie); })
      .on('mouseout',  () => { this.hovered = null; this.render(pie); })
      .on('click', (evt) => {
        console.log('ray clicked', item.name);
        evt.stopPropagation(); 
        
        // 4. Update GLOBE reference
        const feature = this.GLOBE.countries.features.find(f => f.properties.name === item.name);
        if (!feature) return;
      
        const centroid = d3.geoCentroid(feature);
      
        // 4. Update variables reference
        this.variables.globe.start = [-centroid[0], -centroid[1]];
        this.globe.projection.rotate(this.variables.globe.start);
        this.globe.selected = feature;
        this.globe.selection = false; // ← clear reticule mode
      
        // Reset zoom so the containing group isn't offset
        this.globe.svg.call(
          this.globe.zooming.transform,
          d3.zoomIdentity.scale(1)
        );
        this.globe._prevK = 1;
      
        this.onRender();
      });
  }

  error(d, i) {
    const item  = this.data[i];
    const { score, low, high } = item;
    const pad = d.padAngle / 2;
    const ray = { start: d.startAngle + pad, end: d.endAngle - pad };
    const mid = (ray.start + ray.end) / 2;
    const err = { start: 0.5 * (ray.start + mid), end: 0.5 * (ray.end + mid) };

    // 4. Update preview references
    const triangle = {
      base: {
        left:  [(this.preview.width/2) + Math.sin(err.start) * this.scale.scale(high), (this.preview.height/2) - Math.cos(err.start) * this.scale.scale(high)],
        right: [(this.preview.width/2) + Math.sin(err.end)   * this.scale.scale(high), (this.preview.height/2) - Math.cos(err.end)   * this.scale.scale(high)]
      },
      tip: [(this.preview.width/2) + Math.sin(mid) * this.scale.scale(low), (this.preview.height/2) - Math.cos(mid) * this.scale.scale(low)]
    };

    this.errors.append('path')
      .attr('d', `M ${triangle.base.left} L ${triangle.base.right} L ${triangle.tip} Z`)
      // 4. Update variables references
      .attr('fill', this.variables.rays.colors.error)
      .attr('stroke', 'none')
      .attr('fill-opacity', this.variables.rays.stroke.error.opacity);
  }

  render() {
    this.scale.currentYear = this.globe._graph.year;

    const pie = d3.pie()
      .value(() => 1)
      // 4. Update variables reference
      .padAngle(this.variables.rays.angle)
      (this.data);

    const contained = this.globe.contained();

    this.view.selectAll('path').remove();
    this.errors.selectAll('path').remove();

    pie.forEach((d, i) => {
      this.ray(d, i, pie, contained);
      this.error(d, i);
    });

    this.errors.lower(); 
    this.view.raise();
  }

  clear() {
    this.view.selectAll('path').remove();
    this.errors.selectAll('path').remove();
  }
}