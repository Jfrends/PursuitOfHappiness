import * as aq from "npm:arquero";
import { countryFix } from "./countryFix.js";
const { op } = aq;

export function buildMigrationVsHappiness({ migData, happinessData, countryData }) {
  if (!migData || !happinessData || !countryData) {
    throw new Error("Missing input data");
  }

  const happinessGeo = aq.from(happinessData).select(["Year", "Rank", "Country name", "Life evaluation (3-year average)"]).rename({"Life evaluation (3-year average)": "life_evaluation"}).derive({
  name: aq.escape(d =>
    countryFix[d["Country name"]] || d["Country name"]
  )
}).join_right(aq.from(countryData));

  // Filter migration data
  const migrationData = aq
    .from(migData);

  const migrationData2024 = aq
    .from(migData)
    .filter(d => d.year === 2024 && d.sex === "both");

  const countries = Array.from(
    new Set([
      ...migrationData2024.array("origin"),
      ...migrationData2024.array("destination")
    ])
  ).sort();

    const happinessRanks = aq
    .from(happinessData)
    .filter(d => d.Year === 2024)
    .select(["Country name", "Rank"])
    .rename({
      "Country name": "country",
      "Rank": "rank"
    });

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

  const timeSeriesMigrationIncoming = grid
    .join_left(migrationData.filter(d => d.sex === "both"))
    .derive({
        migrant_stock: d => d.migrant_stock ?? 0
    })
    .groupby("destination", "year")
    .rollup({
        total_immigration_in: d => op.sum(d.migrant_stock)
    }).rename({ destination: "Country name", year: "Year"})

  const timeSeriesMigrationOutgoing = grid
    .join_left(migrationData.filter(d => d.sex === "both"))
    .derive({
        migrant_stock: d => d.migrant_stock ?? 0
    })
    .groupby("origin", "year")
    .rollup({
        total_immigration_out: d => op.sum(d.migrant_stock)
    }).rename({ origin: "Country name", year: "Year"})

  const timeSeriesMigration = timeSeriesMigrationIncoming.join(timeSeriesMigrationOutgoing).derive({migration_ratio: d => d.total_immigration_in / d.total_immigration_out})

  const migrationVsHappiness = timeSeriesMigration.join(happinessGeo)

  return migrationVsHappiness;
}