// components/AdjacentPlot.js
import * as Plot from "npm:@observablehq/plot";

export function AdjacentPlot(adjacentData, { width = 1200, year } = {}) {
  return Plot.plot({
    width: width + 60,
    height: 4000,
    marginLeft: 240,
    marginBottom: 60,
    x: { 
      label: "% of population", 
      tickFormat: d => `${(d * 100).toFixed(0)}%`, 
      domain: [0, 0.6], 
    },
    style: {
      fontSize: "22px"  // affects legend and axis labels
    },
    color: {
      domain: ["to happier", "to sadder (adjacent)", "to sadder (non-adjacent)"],
      range: ["#FFD700", "#f97316", "#dc2626"],
      legend: true
    },
    marks: [
      Plot.barX(
        adjacentData
          .filter(d => d.population != null && d.total <= d.population && d.year === year)
          .flatMap(d => {
            const toSadderNonAdjacent = d.toSadder - d.toSadderAdjacent;
            return [
              { origin: d.origin, type: "to sadder (non-adjacent)", value: toSadderNonAdjacent / d.population },
              { origin: d.origin, type: "to sadder (adjacent)",     value: d.toSadderAdjacent / d.population },
              { origin: d.origin, type: "to happier",               value: d.toHappier / d.population },
              { origin: d.origin, type: "staying",                  value: 1 - (d.total / d.population) },
            ]
          }),
        { x: "value", y: "origin", fill: "type", offset: null, inset: 0 }
      )
    ],
    y: {
      label: null,
      // tickRotate: 45,
      padding: 0,
      domain: [...new Map(
        adjacentData
          .filter(d => d.population != null && d.total <= d.population && d.year === year)
          .sort((a, b) => a.originScore - b.originScore)
          .map(d => [d.origin, d.origin])
      ).values()]
    }
  });
}