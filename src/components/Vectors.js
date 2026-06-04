import * as d3 from "npm:d3";

export class Vectors {
  // 1. Add config to the constructor
  constructor(data, containing, globe, config) {
    this.data       = [];
    this.containing = containing;
    this.globe      = globe;

    // 2. Bind the config properties to this class instance
    this.variables = config.variables;
    this.GLOBE     = config.GLOBE;

    // 3. Update variables reference
    this.grid = d3.range(-80, 81, this.variables.vectors.density)
                  .flatMap(lat => d3.range(-180, 181, this.variables.vectors.density)
                  .map(lon => ({ lat, lon })));

    this.layer = this.containing.append('g').attr('class', 'vectors').style('pointer-events', 'none');
  }

  nearestBorderPoint(feature, point) {
    let best = Infinity, nearest = null;

    const rings = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates.flat(1)
      : feature.geometry.coordinates;

    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const candidate = this._nearestOnSegment(ring[i], ring[i + 1], point);
        const d = d3.geoDistance(candidate, point);
        if (d < best) { best = d; nearest = candidate; }
      }
    }
    return { point: nearest, distance: best };
  }

  _nearestOnSegment(a, b, p) {
    const ax = a[0], ay = a[1];
    const bx = b[0], by = b[1];
    const px = p[0], py = p[1];

    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return a;

    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    return [ax + t * dx, ay + t * dy];
  }

  // Call once when selection changes to cache destination centroids
  precompute() {
    this._destCache = this.data.map(flow => {
      // 4. Update GLOBE reference
      const destFeature = this.GLOBE.countries.features
        .find(f => f.properties.name === flow.to);
      if (!destFeature) return null;
      // Use centroid as a single representative point per destination
      const centroid = d3.geoCentroid(destFeature);
      return { count: flow.count, centroid };
    }).filter(Boolean);
  }

  computeVector(gridPoint, sourceFeature) {
    const p = [gridPoint.lon, gridPoint.lat];

    if (d3.geoContains(sourceFeature, p)) return null;

    const { point: srcBorder, distance } = this.nearestBorderPoint(sourceFeature, p);
    if (!srcBorder) return null;

    let dx = 0, dy = 0, totalWeight = 0, maxCount = 0;

    for (const { count, centroid } of this._destCache) {
      const vx = centroid[0] - srcBorder[0];
      const vy = centroid[1] - srcBorder[1];
      const mag = Math.sqrt(vx * vx + vy * vy);
      if (mag === 0) continue;

      // const weight = count / (distance + 0.1);
      const weight = count;
      dx += (vx / mag) * weight;
      dy += (vy / mag) * weight;
      totalWeight += weight;
      maxCount = Math.max(maxCount, count);
    }

    if (totalWeight === 0) return null;

    return {
      lon: gridPoint.lon,
      lat: gridPoint.lat,
      dx: dx / totalWeight,
      dy: dy / totalWeight,
      magnitude: totalWeight,
      maxCount,
    };
  }

  render() {
    const sourceFeature = this.globe.selected;
    
    if (!sourceFeature) {
      this.layer.selectAll('path.vector').remove();
      return;
    }
  
    const projection   = this.globe.projection;
    const sourceCentroid = d3.geoCentroid(sourceFeature);
    const total        = this.data.reduce((s, f) => s + f.count, 0);
    
    if (total === 0) {
      this.layer.selectAll('path.vector').remove();
      return;
    }

    const weightScale = d3.scaleLinear()
      .domain([0, 1])
      // 4. Update variables reference
      .range(this.variables.vectors.weightRange ?? [0.5, 6]);
    
    this.layer.selectAll('path.vector')
      .data(this.data)
      .join('path')
      .attr('class', 'vector')
      .attr('d', flow => {
        // 4. Update GLOBE reference
        const destFeature = this.GLOBE.countries.features.find(f => f.properties.name === flow.to);
        if (!destFeature) return null;
        const destCentroid = d3.geoCentroid(destFeature);
        return this._flowPath(sourceCentroid, destCentroid, projection);
      })
      .attr('fill', 'none')
      .attr('stroke', flow => {
        const sourceName = this.globe.selected?.properties?.name;
        const scores = this.globe.data;
      
        const sourceScore = scores.find(d => d.name === sourceName)?.score;
        const destScore   = scores.find(d => d.name === flow.to)?.score;
      
        if (sourceScore == null || destScore == null) {
          return 'rgba(0, 220, 255, 0.7)';
        }
      
        return destScore > sourceScore
          ? 'rgba(76, 175, 80, 0.8)'
          : 'rgba(244, 67, 54, 0.8)';
      })
      .attr('stroke-width', flow => weightScale(flow.count / total));
  }
  
  _flowPath(source, dest, projection) {
    const line = d3.geoPath().projection(projection);
    return line({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [source, dest]
      }
    });
  }

  _arrowPath(v, projection, size) {
    const [x, y] = projection([v.lon, v.lat]);
    const angle  = Math.atan2(v.dy, v.dx) + Math.PI;

    const tip   = [x + Math.cos(angle) * size,            y + Math.sin(angle) * size];
    const left  = [x + Math.cos(angle + 2.4) * size * 0.5, y + Math.sin(angle + 2.4) * size * 0.5];
    const right = [x + Math.cos(angle - 2.4) * size * 0.5, y + Math.sin(angle - 2.4) * size * 0.5];

    return `M${tip[0]},${tip[1]} L${left[0]},${left[1]} L${right[0]},${right[1]} Z`;
  }
}