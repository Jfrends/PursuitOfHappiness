// components/Graph.js
import * as d3 from "npm:d3";

// 1. Import all of your child classes from the components folder!
import { Globe }   from "./Globe.js";
import { Scales }  from "./Scales.js";
import { Bars }    from "./Bars.js";
import { Rays }    from "./Rays.js";
import { Vectors } from "./Vectors.js";

// 2. Remember to export the class
export class Graph {
  // 3. Add 'config' to your constructor parameters
  constructor(data, migration, initialYear, config) {
    this.data = data;
    this.migration = migration;
    
    // Unpack the config so this file can use preview and variables
    const { preview, variables } = config;

    this.year = initialYear ?? Math.max(...data.map(d => d.Year));

    this.gesture = {
      mode: null
    };

    this.svg = d3.create('svg')
      .attr('width', preview.width)
      .attr('height', preview.height)
      .style("background", variables.background.color);
    
    this.zoom = this.svg.append('g');

    // 4. Instantiate the children, passing the 'config' object down to them!
    this.globe = new Globe(data, this.zoom, this.svg, config);
    this.globe.onSelect(() => this.render());
    this.globe._graph = this;

    const migrationYears = new Set(migration.map(d => +d.year));

    this.scale = new Scales(data, this.zoom, {
      radials: true,
      gesture: this.gesture,
      initGesture: true,
      onYearClick: y => this.setYear(y),
      migrationYears
    }, config); // <-- Pass config here too if Scales needs preview/variables!

    this.globe.interactivity({
      onReset: () => this.render(),
      zoomFilter: () => this.gesture.mode !== "rotateYear"
    });

    this.bars = new Bars(data, this.zoom, this.globe, this.scale, config);
    
    this.rays = new Rays(
      data,
      this.zoom,
      this.globe,
      () => this.render(),
      config
    );
    
    this.vectors = new Vectors(migration, this.zoom, this.globe, config);

    // this.rays.view.raise();
    // this.rays.scale.view.lower(); 
    this.bars.view.raise();
    this.scale.view.lower();

    this.render();
  }

  renderOverlay() {
    if (this.globe.selected) {
      this.rays.clear();
      this.bars.render();
  
      this.vectors.data = this.migration
        .filter(d =>
          +d.year === +this.year &&
          d.origin === this.globe.selected.properties.name
        )
        .map(d => ({
          from: d.origin,
          to: d.destination,
          count: +d.migrant_stock
        }));
  
      this.vectors.precompute();
      this.vectors.render();
    } else {
      this.bars.clear();
      this.vectors.render();
      this.rays.render();
      this.rays.view.raise();
    }
  }

  setYear(y) {
    this.year = y;
    this.scale.updateYear(y);
    this.render();
  }

  render() {
    if (this._rendering) return;
    this._rendering = true;

    const filtered = this.data.filter(d => d.Year === this.year);

    this.globe.data = filtered;
    this.rays.data = filtered;
    this.bars.scale.data = filtered;

    if (this.globe.selected) {
      this.vectors.data = this.migration
        .filter(d =>
          +d.year === +this.year &&
          d.origin === this.globe.selected.properties.name
        )
        .map(d => ({
          from: d.origin,
          to: d.destination,
          count: +d.migrant_stock
        }));
     
      this.vectors.precompute();
    }

    this.globe.render(hovered => {
      this.renderOverlay();
      this.svg.node().value = hovered;
      this.svg.node().dispatchEvent(new CustomEvent('input'));
    });

    this._rendering = false;
  }
}   