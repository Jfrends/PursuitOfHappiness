import * as d3 from "npm:d3";

export class Bars {
  // 1. Add config to the constructor
  constructor(data, containing, globe, scale, config) {
    this.data       = data;
    this.containing = containing;
    this.globe      = globe;
    this.scale      = scale;
    
    // 2. Bind the config properties to this class instance
    this.preview   = config.preview;
    this.variables = config.variables;
    this.GLOBE     = config.GLOBE;

    this.view       = this.containing.append('g');
    this._tooltipEl = null;
  
    this._componentLabels = {
      gdp:           "GDP",
      socialSupport: "social support",
      health:        "healthy life expectancy",
      freedom:       "freedom to make life choices",
      generosity:    "generosity",
      corruption:    "perceptions of corruption",
      dystopia:      "dystopia"
    };
  }
  
  get _tooltip() {
    if (this._tooltipEl) return this._tooltipEl;
  
    this._tooltipEl = d3.select("body")
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(0,0,0,0.75)')
      .style('color', 'white')
      .style('padding', '6px 10px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('line-height', '1.4')
      .style('white-space', 'nowrap')
      .style('opacity', 0)
      .style('transition', 'opacity 0.1s');
  
    return this._tooltipEl;
  }

  _showTooltip(event, html) {
    this._tooltip
      .style('opacity', 1)
      .html(html)
      .style('left', (event.pageX + 12) + 'px')
      .style('top',  (event.pageY - 28) + 'px');
  }
  
  _hideTooltip() {
    this._tooltip.style('opacity', 0);
  }

  score(item, ray, isHovered, isSelected, rBase, rScore, total) {
    const bgPath = d3.path();
    // 3. Update preview variables
    bgPath.arc(this.preview.width / 2, this.preview.height / 2, rBase,  ray.start - Math.PI/2, ray.end - Math.PI/2);
    bgPath.arc(this.preview.width / 2, this.preview.height / 2, rScore, ray.end - Math.PI/2, ray.start - Math.PI/2, true);
    bgPath.closePath();
  
    this.view.append('path')
      .attr('d', bgPath.toString())
      .attr('fill', this.globe.scale(item.score))
      .attr('fill-opacity', isSelected ? 1 : total > 0 ? 0.5 : 0.85)
      // 3. Update variables reference
      .attr('stroke', this.variables.background.color)
      .attr('stroke-width', 0.5)
      .on('mousemove', (event) => {
        this._showTooltip(event, `Score: ${item.score.toFixed(2)}`);
      })
      .on('mouseleave', () => this._hideTooltip())
      .on('click', () => {
        // 3. Update GLOBE reference
        const feature = this.GLOBE.countries.features.find(f => f.properties.name === item.name);
        if (!feature) return;
  
        const centroid = d3.geoCentroid(feature);
  
        // 3. Update variables reference
        this.variables.globe.start = [-centroid[0], -centroid[1]];
        this.globe.projection.rotate(this.variables.globe.start);
        this.globe.selected = feature;
  
        this.globe._graph.render();
      });
  }
  
  components(item, ray, rBase, rScore, total) {
    if (total === 0) return;
  
    let rInner = rBase;
    // 3. Update variables reference
    this.variables.bars.colors.forEach(({ key, color }) => {
      const val = item[key] ?? 0;
      if (val === 0) return;
      const rOuter = rInner + (val / total) * (rScore - rBase);
  
      const arcPath = d3.path();
      // 3. Update preview variables
      arcPath.arc(this.preview.width / 2, this.preview.height / 2, rInner, ray.start - Math.PI/2, ray.end - Math.PI/2);
      arcPath.arc(this.preview.width / 2, this.preview.height / 2, rOuter, ray.end - Math.PI/2, ray.start - Math.PI/2, true);
      arcPath.closePath();
  
      const label = this._componentLabels[key] ?? key;
      const pct   = item.score > 0 ? (val / item.score * 100).toFixed(1) : '0.0';
  
      this.view.append('path')
        .attr('d', arcPath.toString())
        .attr('fill', color)
        .attr('fill-opacity', 0.8)
        // 3. Update variables reference
        .attr('stroke', this.variables.background.color)
        .attr('stroke-width', 0.5)
        .on('mousemove', (event) => {
          this._showTooltip(event,
            `Score: ${item.score.toFixed(2)}<br>` +
            `Amount explained by ${label}: ${val.toFixed(2)} (${pct}%)`
          );
        })
        .on('mouseleave', () => this._hideTooltip());
  
      rInner = rOuter;
    });
  }

  roundedTriangle(x1, y1, x2, y2, x3, y3, r = 2) {
    const lerp = (a, b, t) => a + (b - a) * t;
    const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  
    const pts = [[x1,y1],[x2,y2],[x3,y3]];
    let d = '';
  
    pts.forEach(([px, py], i) => {
      const [ax, ay] = pts[(i + 2) % 3];
      const [bx, by] = pts[(i + 1) % 3];
  
      const dA = dist(px, py, ax, ay);
      const dB = dist(px, py, bx, by);
      const tA = Math.min(r / dA, 0.5);
      const tB = Math.min(r / dB, 0.5);
  
      const p1x = lerp(px, ax, tA), p1y = lerp(py, ay, tA);
      const p2x = lerp(px, bx, tB), p2y = lerp(py, by, tB);
  
      if (i === 0) d += `M ${p1x} ${p1y}`;
      else         d += `L ${p1x} ${p1y}`;
  
      d += ` Q ${px} ${py} ${p2x} ${p2y}`;
    });
  
    return d + ' Z';
  }

  difference() {
    const sorted = [...this.data]
    .filter(item => this.globe.selected && item.name === this.globe.selected.properties.name)
    .sort((a, b) => a.Year - b.Year);
  
    sorted.forEach((item, i) => {
      if (i === 0) return;
  
      const prev  = sorted[i - 1];
      const curr  = item;
      const delta = curr.score - prev.score;
      if (delta === 0) return;
  
      const isIncrease = delta > 0;
  
      const aPrev  = this.scale.radial(prev.Year);
      const pad    = 0.025;
      const aArrow = aPrev + this.scale.step;
  
      const rBase  = this.scale.scale(0);
      const rPrev  = this.scale.scale(prev.score);
      const rCurr  = this.scale.scale(curr.score);
      const rShort = Math.min(rPrev, rCurr);
  
      const angle  = aArrow - Math.PI / 2;
      const radialX =  Math.cos(angle);
      const radialY =  Math.sin(angle);
      const perpX   = -Math.sin(angle);
      const perpY   =  Math.cos(angle);
  
      const size = 8;
      const dir  = isIncrease ? 1 : -1;
      const rMid = this.scale.scale.range()[1] + ( size / 2 ) * 4;
  
      // 3. Update preview variables
      const cx = this.preview.width  / 2 + rMid * radialX;
      const cy = this.preview.height / 2 + rMid * radialY;
  
      const tipX = cx + dir * size * radialX;
      const tipY = cy + dir * size * radialY;
      const b1x  = cx - dir * size * radialX + size * 1.4 * perpX;
      const b1y  = cy - dir * size * radialY + size * 1.4 * perpY;
      const b2x  = cx - dir * size * radialX - size * 1.4 * perpX;
      const b2y  = cy - dir * size * radialY - size * 1.4 * perpY;
  
      this.view.append('path')
        .attr('d', this.roundedTriangle(tipX, tipY, b1x, b1y, b2x, b2y, 1.5))
        // 3. Update variables reference (Optional: Ensure triangles is in your config!)
        .attr('fill', isIncrease ? this.variables.triangles?.increase ?? '#4CAF50' : this.variables.triangles?.decrease ?? '#F44336')
        .attr('fill-opacity', 0.9);
    });
  }

  render() {
    this.scale.updateYear(this.globe._graph.year);
    this.scale.show();
    this.view.selectAll('path').remove();
    this.data.forEach((item) => {
      const a   = this.scale.radial(item.Year);
      const pad = 0.025;
      const ray = { start: a + pad, end: a + this.scale.step - pad };

      const isHovered  = this.globe.hovered  && item.name === this.globe.hovered.properties.name;
      const isSelected = this.globe.selected && item.name === this.globe.selected.properties.name;
      const rBase      = this.scale.scale(0);
      const rScore     = this.scale.scale(item.score);
      // 3. Update variables reference
      const total      = this.variables.bars.colors.reduce((s, c) => s + (item[c.key] ?? 0), 0);

      if (isSelected) {
        this.score(item, ray, isHovered, isSelected, rBase, rScore, total);
        this.components(item, ray, rBase, rScore, total);
      }
    });

    this.difference();
  }

  clear() {
    this.view.selectAll('path').remove();
    this._hideTooltip();
  
    if (!this.scale._gesturing) {
      this.scale.hide();
    }
  }
}