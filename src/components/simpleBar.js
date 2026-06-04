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

  const chartWidth = Math.min(width * 0.55, 680);
  
  return vl
    .layer(
      vl
        .markBar({
          cornerRadiusTopLeft: 5,
          cornerRadiusTopRight: 5
        })
        .data(data)
        .encode(
          vl
            .x()
            .fieldN("directionLabel")
            .title(null)
            .sort(["Toward less happy countries", "Toward happier countries"])
            .axis({
              labelAngle: 0,
              labelFontSize: 13,
              labelColor: "#d8d8d8",
              labelPadding: 8,
              labelLimit: 240
            }),
          vl
            .y()
            .fieldQ("totalMigrants")
            .title("Total international migrant stock")
            .axis({
              format: "~s",
              grid: true,
              labelColor: "#d8d8d8",
              labelFontSize: 12,
              titleColor: "#d8d8d8",
              titleFontSize: 13,
              titlePadding: 12
            }),
          vl
            .color()
            .fieldN("directionLabel")
            .legend(null)
            .scale({
              domain: ["Toward less happy countries", "Toward happier countries"],
              range: ["#6EA8FE", "#F5C036"]
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
              title: "Migrant stock",
              format: ","
            }
          ])
        ),

      vl
        .markText({
          dy: -8,
          fontSize: 13,
          fontWeight: "bold",
          color: "#f2f2f2"
        })
        .data(data)
        .encode(
          vl
            .x()
            .fieldN("directionLabel")
            .sort(["Toward less happy countries", "Toward happier countries"]),
          vl.y().fieldQ("totalMigrants"),
          vl.text().fieldQ("totalMigrants").format(".3s")
        )
    )
    .width(chartWidth)
    .height(350)
    .title({
      text: "Migrant stock is higher toward countries with higher life evaluations",
      anchor: "start",
      fontSize: 17,
      subtitleFontSize: 12,
      color: "#f2f2f2",
      subtitleColor: "#bdbdbd",
      offset: 12
    })
    .background("#111111")
    .config({
      view: {
        stroke: null
      },
      axis: {
        labelFont: "system-ui, sans-serif",
        titleFont: "system-ui, sans-serif",
        gridColor: "#333333",
        domainColor: "#777777",
        tickColor: "#777777"
      },
      title: {
        font: "system-ui, sans-serif"
      }
    })
    .render();
}