import * as vega from "npm:vega";
import * as vegaLite from "npm:vega-lite";
import * as vegaLiteApi from "npm:vega-lite-api";

const vl = vegaLiteApi.register(vega, vegaLite);

export function simpleBar(happinessFlows, width = 600) {
  const labelMap = {
    "Moving Towards Happiness": "Toward happier countries",
    "Moving Toward Happiness": "Toward happier countries",
    "Moving Away From Happiness": "Toward less happy countries",
    "Moving Away from Happiness": "Toward less happy countries"
  };

  const data = happinessFlows.map((d) => ({
    ...d,
    directionLabel: labelMap[d.direction] ?? d.direction,
    totalMigrants: Number(d.totalMigrants)
  }));

  const chartWidth = Math.min(width * 0.9, 900);

  return vl
    .layer(
      // Main bars
      vl
        .markBar({
          cornerRadiusTopLeft: 4,
          cornerRadiusTopRight: 4
        })
        .data(data)
        .encode(
          vl
            .x()
            .fieldN("directionLabel")
            .title(null)
            .sort([
              "Toward less happy countries",
              "Toward happier countries"
            ])
            .axis({
              labelAngle: 0,
              labelFontSize: 13,
              labelLimit: 220,
              labelPadding: 8
            }),

          vl
            .y()
            .fieldQ("totalMigrants")
            .title("Total international migrant stock")
            .axis({
              format: "~s",
              grid: true,
              labelFontSize: 12,
              titleFontSize: 13,
              titlePadding: 12
            }),

          vl
            .color()
            .fieldN("directionLabel")
            .legend(null)
            .scale({
              domain: [
                "Toward less happy countries",
                "Toward happier countries"
              ],
              range: ["#4E79A7", "#F28E2B"]
            }),

          vl.tooltip([
            {
              field: "directionLabel",
              type: "nominal",
              title: "Direction"
            },
            {
              field: "totalMigrants",
              type: "quantitative",
              title: "Total migrants",
              format: ","
            }
          ])
        ),

      // Value labels above bars
      vl
        .markText({
          dy: -8,
          fontSize: 13,
          fontWeight: "bold"
        })
        .data(data)
        .encode(
          vl
            .x()
            .fieldN("directionLabel")
            .sort([
              "Toward less happy countries",
              "Toward happier countries"
            ]),
          vl.y().fieldQ("totalMigrants"),
          vl.text().fieldQ("totalMigrants").format("~s")
        )
    )
    .width(chartWidth)
    .height(360)
    .title({
      text: "Most recorded migration is toward countries with higher life evaluations",
      subtitle:
        "Direction is based on whether the destination country’s happiness score is higher or lower than the origin country’s score.",
      anchor: "start",
      fontSize: 18,
      subtitleFontSize: 13,
      subtitleColor: "#555",
      offset: 14
    })
    .config({
      view: {
        stroke: null
      },
      axis: {
        labelFont: "system-ui, sans-serif",
        titleFont: "system-ui, sans-serif",
        gridColor: "#e6e6e6",
        domainColor: "#999",
        tickColor: "#999"
      },
      title: {
        font: "system-ui, sans-serif"
      }
    })
    .render();
}