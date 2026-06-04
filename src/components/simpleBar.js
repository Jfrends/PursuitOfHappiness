// components/simpleBar.js
import * as d3 from "npm:d3";

export function simpleBar(happinessFlows, width = 600) {
  const labelMap = {
    "Moving Towards Happiness": "Toward happier countries",
    "Moving Toward Happiness": "Toward happier countries",
    "Moving Away From Happiness": "Toward less happy countries",
    "Moving Away from Happiness": "Toward less happy countries"
  };

  const data = happinessFlows
    .map((d) => ({
      ...d,
      directionLabel: labelMap[d.direction] ?? d.direction,
      totalMigrants: Number(d.totalMigrants)
    }))
    .filter((d) => Number.isFinite(d.totalMigrants))
    .sort((a, b) =>
      d3.ascending(
        ["Toward less happy countries", "Toward happier countries"].indexOf(a.directionLabel),
        ["Toward less happy countries", "Toward happier countries"].indexOf(b.directionLabel)
      )
    );

  const chartWidth = Math.min(width * 0.55, 680);
  const height = 400;

  const margin = {
    top: 58,
    right: 24,
    bottom: 54,
    left: 78
  };

  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const wrapper = d3
    .create("div")
    .style("position", "relative")
    .style("font-family", "system-ui, sans-serif");

  const tooltip = wrapper
    .append("div")
    .style("position", "fixed")
    .style("visibility", "hidden")
    .style("background", "#1f1f1f")
    .style("color", "#f2f2f2")
    .style("border", "1px solid #444")
    .style("border-radius", "8px")
    .style("padding", "8px 10px")
    .style("font-size", "12px")
    .style("box-shadow", "0 4px 16px rgba(0,0,0,0.35)")
    .style("pointer-events", "none")
    .style("z-index", "20");

  const svg = wrapper
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", height)
    .attr("viewBox", `0 0 ${chartWidth} ${height}`)
    .attr("style", "max-width: 100%; height: auto; background: #111;");

  svg
    .append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("fill", "#f2f2f2")
    .attr("font-size", 17)
    .attr("font-weight", 700)
    .text("Migrant stock is higher toward countries with higher life evaluations");

  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.directionLabel))
    .range([margin.left, chartWidth - margin.right])
    .padding(0.28);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.totalMigrants) ?? 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3
    .scaleOrdinal()
    .domain(["Toward less happy countries", "Toward happier countries"])
    .range(["#6EA8FE", "#F5C036"]);

  const yAxis = d3
    .axisLeft(y)
    .ticks(5)
    .tickFormat(d3.format("~s"))
    .tickSize(-(chartWidth - margin.left - margin.right));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll("line").attr("stroke", "#333"))
    .call((g) => g.selectAll("text").attr("fill", "#d8d8d8").attr("font-size", 12));

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("fill", "#d8d8d8")
    .attr("font-size", 13)
    .text("Total international migrant stock");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call((g) => g.select(".domain").attr("stroke", "#777"))
    .call((g) =>
      g
        .selectAll("text")
        .attr("fill", "#d8d8d8")
        .attr("font-size", 13)
        .attr("dy", "1.2em")
    );

  const bars = svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.directionLabel))
    .attr("width", x.bandwidth())
    .attr("y", height - margin.bottom)
    .attr("height", 0)
    .attr("rx", 5)
    .attr("fill", (d) => color(d.directionLabel))
    .on("mouseenter", function (event, d) {
      d3.select(this).attr("opacity", 0.85);

      tooltip
        .style("visibility", "visible")
        .html(
          `<strong>${d.directionLabel}</strong><br>
           Migrant stock: ${d3.format(",")(d.totalMigrants)}`
        );
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.clientX + 12}px`)
        .style("top", `${event.clientY + 12}px`);
    })
    .on("mouseleave", function () {
      d3.select(this).attr("opacity", 1);
      tooltip.style("visibility", "hidden");
    });

  bars
    .transition()
    .duration(900)
    .delay((_, i) => i * 120)
    .ease(d3.easeCubicOut)
    .attr("y", (d) => y(d.totalMigrants))
    .attr("height", (d) => height - margin.bottom - y(d.totalMigrants));

  const labels = svg
    .append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", (d) => (x(d.directionLabel) ?? 0) + x.bandwidth() / 2)
    .attr("y", height - margin.bottom)
    .attr("text-anchor", "middle")
    .attr("fill", "#f2f2f2")
    .attr("font-size", 13)
    .attr("font-weight", 700)
    .attr("opacity", 0)
    .text((d) => d3.format(".3s")(d.totalMigrants));

  labels
    .transition()
    .duration(700)
    .delay((_, i) => 650 + i * 120)
    .ease(d3.easeCubicOut)
    .attr("y", (d) => y(d.totalMigrants) - 8)
    .attr("opacity", 1);

  return wrapper.node();
}