import * as aq from "npm:arquero";
import { countryFix } from "./countryFix.js";

export function buildHappinessFlows({ migrationData, happinessData }) {
  if (!migrationData || !happinessData) {
    throw new Error("Missing input data");
  }

  // Keep happiness rank table clean
  const happinessRanks = aq
    .from(happinessData)
    .select(["Year", "Rank", "Country name", "Life evaluation (3-year average)"]).rename({"Life evaluation (3-year average)": "life_evaluation"}).derive({
    name: aq.escape(d =>
    countryFix[d["Country name"]] || d["Country name"]
    )})
    .filter(d => d.Year === 2024)
    .select(["Country name", "Rank"])
    .rename({
      "Country name": "country",
      "Rank": "rank"
    });

  // Filter migration data
  const migrationData2024 = aq
    .from(migrationData)
    .filter(d => d.year === 2024 && d.sex === "both");

  // Unique country list
  const countries = Array.from(
    new Set([
      ...migrationData2024.array("origin"),
      ...migrationData2024.array("destination")
    ])
  ).sort();

  // Node table with ranks joined in
  const nodesTable = aq
    .table({ country: countries })
    .join(happinessRanks, ["country"])
    .derive({
      rank: d => d.rank ?? 9999
    });

  // Create origin/destination pairs
  const grid = nodesTable
    .cross(nodesTable)
    .rename({
      country_1: "origin",
      country_2: "destination"
    });

  // Join migration data onto pairs
  const adjacencyMatrix = grid
  .join_left(migrationData2024)
  .derive({ 
    migrant_stock: d => d.migrant_stock ?? 0 
  });

  return adjacencyMatrix
    .derive({
      migrant_stock: d => d.migrant_stock ?? 0,

      direction: d =>
        d.rank_2 < d.rank_1
          ? "Moving Towards Happiness"
          : "Moving Away From Happiness"
    })
    .groupby("direction")
    .rollup({
      totalMigrants: rows => aq.op.sum(rows.migrant_stock)
    })
    .objects();
}