import * as d3 from "npm:d3";

export function CandleChart(happy, { width = 800 } = {}) {
  const w = width;
  const h = width / 3;
  const marginTop = 20;
  const marginRight = 30;
  const marginBottom = 30;
  const marginLeft = 40;

  // Compute per-year stats
  const years = [...new Set(happy.map(d => d.Year))].sort((a, b) => a - b);
  const candleData = years.map((year) => {
    const rows = happy.filter(d => d.Year === year);
    const scores = rows.map(d => d.score).sort((a, b) => a - b);
    const low      = d3.min(scores);
    const high     = d3.max(scores);
    const q1       = d3.quantile(scores, 0.25);
    const q3       = d3.quantile(scores, 0.75);
    const median   = d3.quantile(scores, 0.5);
    return { year, low, high, q1, q3, median, prevMedian: null, prev: null };
  });
  
  candleData.forEach((d, i) => {
    if (i > 0) {
      d.prevMedian = candleData[i - 1].median;
      d.prev = candleData[i - 1];
    }
  });

  // Scales
  const x = d3.scaleBand()
      .domain(years)
      .range([marginLeft, w - marginRight])
      .padding(0.2);
      
  const y = d3.scaleLinear()
      .domain([1, 8.0])
      .rangeRound([h - marginBottom, marginTop]);

  // Create a wrapper DIV to hold both the SVG and the Tooltip
  // This removes the need for 'invalidation' cleanup
  const container = d3.create("div")
      .style("position", "relative")
      .style("width", `${w}px`)
      .style("height", `${h}px`);

  // Tooltip (Attached to the container instead of document.body)
  const fmt = d3.format(".3f");
  const fmtChg = d3.format("+.3f");

  const tooltip = container.append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border", "1px solid #ccc")
      .style("border-radius", "8px")
      .style("padding", "8px 12px")
      .style("font", "13px/1.5 sans-serif")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
      .style("z-index", "10");

  function tooltipHTML(d) {
    const p = d.prev;
    const rows = [
      ["High",   d.high,   p?.high],
      ["Q3",     d.q3,     p?.q3],
      ["Median", d.median, p?.median],
      ["Q1",     d.q1,     p?.q1],
      ["Low",    d.low,    p?.low],
    ];
    return `<div style="text-align:center;font-weight:bold;font-size:16px;margin-bottom:6px">${d.year}</div>
    <table style="border-collapse:collapse;min-width:140px">
      ${rows.map((r, i) => {
        const delta = d.prev !== null ? (r[1] - r[2])  : null;
        const color = delta == null ? "black" : delta > 0 ? "green" : delta < 0 ? "red" : "black";
        const val   = delta == null ? fmt(r[1]) : fmtChg(delta);
        return `
        <tr style="${i > 0 ? "border-top:1px solid #e0e0e0" : ""}">
          <td style="text-align:left;padding:2px 12px 2px 0;color:#555">${r[0]}</td>
          <td style="text-align:right;padding:2px 0;font-variant-numeric:tabular-nums;font-weight:bold;color:${color}">${val}</td>
        </tr>`;
      }).join("")}
    </table>`;
  }

  // SVG
  const svg = container.append("svg")
      .attr("viewBox", [0, 0, w, h])
      .attr("width", w)
      .attr("height", h);

  svg.append("rect")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "#111111");

  // Y axis with grid lines
  svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y))
      .call(g => g.selectAll("text").attr("fill", "white"))
      .call(g => g.selectAll(".tick line").clone()
          .attr("stroke", "white")
          .attr("stroke-opacity", 0.2)
          .attr("x2", w - marginLeft - marginRight))
      .call(g => g.select(".domain").remove());

  // Candle groups
  const g = svg.append("g")
      .attr("stroke-linecap", "round")
      .attr("stroke", "white")
    .selectAll("g")
    .data(candleData)
    .join("g")
      .attr("transform", d => `translate(${x(d.year)},0)`);

  // Wick: full low–high range
  g.append("line")
      .attr("y1", d => y(d.low))
      .attr("y2", d => y(d.high))
      .attr("x1", x.bandwidth() / 2)
      .attr("x2", x.bandwidth() / 2)
      .attr("stroke-width", x.bandwidth() * 0.05);

  // Body: q1–q3, colored by median direction
  g.append("line")
      .attr("y1", d => y(d.q1))
      .attr("y2", d => y(d.q3))
      .attr("x1", x.bandwidth() / 2)
      .attr("x2", x.bandwidth() / 2)
      .attr("stroke-width", x.bandwidth() * 0.5)
      .attr("stroke", d =>
          d.prevMedian === null  ? "white"
        : d.median > d.prevMedian  ? d3.schemeSet1[2]
        : d.median < d.prevMedian  ? d3.schemeSet1[0]
        :                            d3.schemeSet1[8]);

  // Median tick
  g.append("line")
      .attr("y1", d => y(d.median))
      .attr("y2", d => y(d.median))
      .attr("x1", x.bandwidth() / 2)
      .attr("x2", x.bandwidth() / 2)
      .attr("stroke-width", x.bandwidth() * 0.1)
      .attr("stroke", d =>
          d.prevMedian === null || d.median >= d.prevMedian ? "black" : "white");

  // Mouse interactions
  g.on("mouseover", function(event, d) {
      tooltip.html(tooltipHTML(d)).style("visibility", "visible");
    })
    .on("mousemove", function(event) {
      // Calculate coordinates relative to our new container div!
      const [mouseX, mouseY] = d3.pointer(event, container.node());
      const tw = tooltip.node().offsetWidth;
      
      const overflowRight = mouseX + 16 + tw > w;
      
      tooltip
        .style("top",  (mouseY - 10) + "px")
        .style("left", overflowRight 
          ? (mouseX - tw - 16) + "px" 
          : (mouseX + 16) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("visibility", "hidden");
    });

  // Return the wrapper div containing the chart and tooltip
  return container.node();
}