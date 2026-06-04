import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";

// 1. Register the core rendering engines with the API
const vl = vegaLiteApi.register(vega, vegaLite);

export function simpleBar(happinessFlows, width = 600) {
  return vl
    .markBar()
    .data(happinessFlows)
    .encode(
      vl.x().fieldN("direction").title("Direction"),
      vl.y().fieldQ("totalMigrants").title("Total Migrants"),
      vl.color().fieldN("direction").legend(null),
      vl.tooltip([
        vl.fieldN("direction"),
        vl.fieldQ("totalMigrants")
      ])
    )
    .width(width * 0.7)
    .render();
}