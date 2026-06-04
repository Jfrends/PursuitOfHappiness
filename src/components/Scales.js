import * as d3 from "npm:d3";

export class Scales {
  // 1. Accept config as the final parameter
  constructor(data, containing, { rings = true, radials = false, onYearClick = null, gesture = null, initGesture = true, migrationYears = new Set() } = {}, config) {
    this.data           = data;
    this.containing     = containing;
    this.onYearClick    = onYearClick;
    this.gesture        = gesture;
    this.migrationYears = migrationYears;

    // 2. Bind config references
    this.preview   = config.preview;
    this.variables = config.variables;

    this.currentYear = Math.max(...data.map(d => d.Year));
    this.years = [...new Set(data.map(d => d.Year))].sort(d3.ascending);

    this._hasRadials = radials;
    this._showYearText = false;
    this._gesturing = false;
    this._lastRotation = null;

    // 3. Update preview variables
    this.scale = d3.scaleLinear()
      .domain([0, 10])
      .range([this.preview.radius * 0.55, this.preview.radius]);

    // 3. Update variables reference
    this.ring = d3.scaleLinear()
      .domain(this.variables.rays.scale.domain)
      .range(this.variables.rays.colors.scale);

    this.step = (2 * Math.PI) / this.years.length;

    this.radial = d3.scalePoint()
      .domain(this.years)
      .range([0, 2 * Math.PI - this.step]);

    this.view = containing.append('g');

    if (rings) this.rings();
    if (radials) this.radials();

    if (initGesture) this.initGesture();
  }

  rings() {
    this.variables.rays.scale.values.forEach(i => {
      this.view.append('circle')
        .attr('cx', this.preview.width / 2)
        .attr('cy', this.preview.height / 2)
        .attr('r', this.scale(i))
        .attr('fill', 'none')
        .attr('stroke', this.ring(i))
        .attr('stroke-width', this.variables.rays.stroke.scale.width)
        .attr('stroke-dasharray', this.variables.rays.stroke.scale.style.join(','));
    });

    this.scales();
  }

  scales() {
    this.variables.rays.scale.values.forEach(i => {
      this.view.append('text')
        .attr('x', this.preview.width / 2)
        .attr('y', this.preview.height / 2 - this.scale(i) + this.variables.rays.scale.offset)
        .attr('text-anchor', 'middle')
        .attr('font-size', this.variables.rays.fonts.labels.size)
        .attr('fill', this.ring(i))
        .attr('stroke', this.variables.rays.colors.labels)
        .attr('stroke-width', this.variables.rays.stroke.labels.width)
        .attr('paint-order', 'stroke')
        .text(i);
    });
  }

  radials() {
    this.view.append('g')
      .selectAll('path')
      .data(this.years)
      .join('path')
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', d => {
          const [, y2] = d3.pointRadial(this.radial(d), this.variables.rays.radius.outer);
          return y2 < -this.variables.rays.radius.outer * 0.99 ? 0 : 0.2;
        })
        .attr('d', d => {
          const [x1, y1] = d3.pointRadial(this.radial(d), this.variables.rays.radius.inner);
          const [x2, y2] = d3.pointRadial(this.radial(d), this.variables.rays.radius.outer);

          const cx = this.preview.width / 2;
          const cy = this.preview.height / 2;

          return `M${x1 + cx},${y1 + cy}
                  L${x2 + cx},${y2 + cy}`;
        });

    this.yeartext();
  }

  initGesture() {
    let accumulated = 0;
    const threshold = 5;
    const svg = this.view.node().closest('svg');
  
    svg.addEventListener('gesturestart', e => {
      e.preventDefault();
  
      accumulated = 0;
      this._lastRotation = e.rotation;
      this._startScale = e.scale;
  
      this._gesturing = false;
      this._showYearText = false;
  
      if (this.gesture) {
        this.gesture.mode = null;
      }
    }, { passive: false });
  
    svg.addEventListener('gesturechange', e => {
      const rotationDelta = e.rotation - (this._lastRotation ?? e.rotation);
      const scaleDelta = Math.abs(e.scale - (this._startScale ?? 1));
  
      this._lastRotation = e.rotation;
  
      if (!this._gesturing) {
        const rotationAmount = Math.abs(e.rotation);
        const isMostlyRotation = rotationAmount > 3 && rotationAmount > scaleDelta * 40;
  
        if (!isMostlyRotation) {
          return; // let d3 zoom handle it
        }
  
        e.preventDefault();
  
        this._gesturing = true;
        this._showYearText = true;
  
        if (this.gesture) {
          this.gesture.mode = "rotateYear";
        }
  
        this.show();
        this.view.select('g.year-labels').remove();
        this.yeartext();
      }
  
      e.preventDefault();
  
      accumulated += rotationDelta;
  
      if (Math.abs(accumulated) < threshold) return;
  
      const steps = Math.trunc(accumulated / threshold);
      accumulated -= steps * threshold;
  
      const idx = this.years.indexOf(this.currentYear);
      const nextIdx = ((idx + steps) % this.years.length + this.years.length) % this.years.length;
      const nextYear = this.years[nextIdx];
  
      if (nextYear !== this.currentYear) {
        this.currentYear = nextYear;
  
        this.view.select('g.year-labels').remove();
        this.yeartext();
  
        if (this.onYearClick) {
          this.onYearClick(nextYear);
        }
      }
    }, { passive: false });
  
    svg.addEventListener('gestureend', e => {
      if (this._gesturing) {
        e.preventDefault();
      }
  
      this._lastRotation = null;
      this._startScale = null;
      accumulated = 0;
  
      this._showYearText = false;
      this._gesturing = false;
  
      if (this.gesture) {
        this.gesture.mode = null;
      }
  
      this.view.select('g.year-labels').remove();
      this.yeartext();
    }, { passive: false });
  }

  updateYear(y) {
    this.currentYear = y;
    this.view.select('g.year-labels').remove();
    this.yeartext();
  }

  yeartext() {
    const g = this.view.append('g').attr('class', 'year-labels');
  
    if (!this._hasRadials && !this._showYearText) {
      g.style('display', 'none');
      return;
    }
  
    g.selectAll('g')
      .data(this.years)
      .join('g')
      .each((d, i, nodes) => {
        const a = this.radial(d);
        const b = a + this.step;
        const mid = (a + b) / 2;
  
        const flip = mid > Math.PI / 2 && mid < 3 * Math.PI / 2;
        const start = flip ? b : a;
        const end = flip ? a : b;
        const sweep = flip ? 0 : 1;
  
        const r = this.variables.rays.radius.outer + (flip ? 25 : 12);
  
        const [x1, y1] = d3.pointRadial(start, r);
        const [x2, y2] = d3.pointRadial(end, r);
  
        const id = `year-label-${d}`;
  
        const node = d3.select(nodes[i])
          .style('cursor', 'pointer')
          .on('click', () => {
            this.currentYear = d;
            if (this.onYearClick) this.onYearClick(d);
          });
  
        const pillH = 20;
        const pillPad = 0.12;
        const pillOffset = flip ? -7 : 7;
  
        const rInner = r - pillH / 2 + pillOffset;
        const rOuter = r + pillH / 2 + pillOffset;
  
        const aStart = mid - pillPad;
        const aEnd = mid + pillPad;
  
        const [piX1, piY1] = d3.pointRadial(flip ? aEnd : aStart, rInner);
        const [piX2, piY2] = d3.pointRadial(flip ? aStart : aEnd, rInner);
        const [poX1, poY1] = d3.pointRadial(flip ? aEnd : aStart, rOuter);
        const [poX2, poY2] = d3.pointRadial(flip ? aStart : aEnd, rOuter);
  
        const capSweep = flip ? 1 : 0;
  
        const cx = this.preview.width / 2;
        const cy = this.preview.height / 2;

        const pillPath = `
          M ${piX1 + cx}, ${piY1 + cy}
          A ${rInner},${rInner} 0,0,${sweep} ${piX2 + cx},${piY2 + cy}
          A ${pillH / 2},${pillH / 2} 0,0,${capSweep} ${poX2 + cx},${poY2 + cy}
          A ${rOuter},${rOuter} 0,0,${flip ? 1 : 0} ${poX1 + cx},${poY1 + cy}
          A ${pillH / 2},${pillH / 2} 0,0,${capSweep} ${piX1 + cx},${piY1 + cy}
          Z
        `;
  
        if (d === this.currentYear) {
          node.append('path')
            .attr('fill', 'white')
            .attr('opacity', 0.95)
            .attr('d', pillPath);
        } else if (this.migrationYears.has(d)) {
          node.append('path')
            .attr('fill', '#3b82f6')
            .attr('opacity', 0.85)
            .attr('d', pillPath);
        }
  
        node.append('path')
          .attr('id', id)
          .attr('fill', 'none')
          .attr('stroke', 'none')
          .attr('d', `M${x1 + cx},${y1 + cy}
                      A${r},${r} 0,0,${sweep}
                      ${x2 + cx},${y2 + cy}`);
  
        node.append('text')
          .attr('fill', d === this.currentYear ? '#000' : 'white')
          .attr('font-size', 20)
          .append('textPath')
            .attr('href', `#${id}`)
            .attr('startOffset', '50%')
            .attr('text-anchor', 'middle')
            .text(d);
      });
  }

  show() {
    this.view.style('display', null);
  }

  hide() {
    this.view.style('display', 'none');
  }

  clear() {
    this.view.selectAll('*').remove();
  }
}