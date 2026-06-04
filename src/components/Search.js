import * as d3 from "npm:d3";

export class Search {
  // 1. Add config to the constructor
  constructor(globe, parentElement, config) { 
    this.globe = globe;

    // 2. Bind the config properties to this class instance
    this.variables = config.variables;
    this.GLOBE     = config.GLOBE;

    // Container: Positioned relative to the provided parent (the SVG container)
    this.container = d3.select(parentElement).append("div")
      .style("position", "absolute")
      .style("top", "20px")
      .style("left", "20px")
      .style("z-index", "100") 
      .style("font-family", "sans-serif");

    this.input = this.container.append("input")
      .attr("type", "text")
      .attr("placeholder", "Search country...")
      .style("padding", "6px 12px")
      .style("border-radius", "20px")
      .style("border", "1px solid #FFFFFF44")
      .style("background", "#1a1a1a")
      .style("color", "#fff")
      .style("font-size", "13px")
      .style("width", "200px")
      .style("outline", "none");

    this.dropdown = this.container.append("div")
      .style("position", "absolute")
      .style("top", "32px")
      .style("left", "0")
      .style("width", "100%")
      .style("background", "#1a1a1a")
      .style("border", "1px solid #FFFFFF44")
      .style("border-radius", "8px")
      .style("overflow", "hidden")
      .style("display", "none")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.5)");

    // 3. Update GLOBE reference
    this.names = this.GLOBE.countries.features.map(f => f.properties.name).sort();

    this.input.on("input", () => this.update());
    this.input.on("keydown", (evt) => {
      if (evt.key === "Escape") this.close();
    });

    // Fix: Stop propagation so clicking the search bar doesn't trigger "outside click"
    this.container.on("click", (evt) => {
      evt.stopPropagation(); 
    });

    // Close on outside click
    d3.select(window).on("click.search", () => this.close());
  }

  update() {
    const q = this.input.node().value.trim().toLowerCase();
    if (!q) { this.dropdown.style("display", "none"); return; }

    const matches = this.names.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
    if (!matches.length) { this.dropdown.style("display", "none"); return; }

    this.dropdown.style("display", "block")
      .selectAll("div")
      .data(matches)
      .join("div")
        .text(d => d)
        .style("padding", "8px 12px")
        .style("color", "#fff")
        .style("font-size", "13px")
        .style("cursor", "pointer")
        .on("mouseover", function() { d3.select(this).style("background", "#333"); })
        .on("mouseout",  function() { d3.select(this).style("background", "none"); })
        .on("click", (evt, name) => {
          this.select(name);
          evt.stopPropagation(); // Prevent triggering the window click
        });
  }

  select(name) {
    // 3. Update GLOBE reference
    const feature = this.GLOBE.countries.features.find(f => f.properties.name === name);
    if (!feature) return;

    const centroid = d3.geoCentroid(feature);
    
    // 3. Update variables reference
    this.variables.globe.start = [-centroid[0], -centroid[1]];
    this.globe.projection.rotate(this.variables.globe.start);
    this.globe.selected  = feature;
    this.globe.selection = false;
    
    if (this.globe._reticuleEl) {
      this.globe._reticuleEl.remove();
      this.globe._reticuleEl = null;
    }

    this.input.node().value = name;
    this.close();
    this.globe.render();
  }

  close() {
    this.dropdown.style("display", "none");
  }
}