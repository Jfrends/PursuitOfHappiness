import * as d3 from "npm:d3";

export function processAdjacent({ happy, POPULATION, ADJACENCY, migration }) {
  // 1. Safety check
  if (!happy || !POPULATION || !ADJACENCY || !migration) {
    throw new Error("Missing input datasets for adjacent calculation.");
  }

  const happyIndex = new Map(
    happy.map(d => [`${d.name}|${d.Year}`, d.score])
  );

  const popIndex = new Map(
    POPULATION.objects().map(d => [`${d.country}|${d.year}`, d.population])
  );

  const adjacentPairs = new Set(
    ADJACENCY.objects().map(d => `${d.country}|${d.neighbor}`)
  );

  // Safely extract standard array if migration happens to be an Arquero table
  const migrationRows = typeof migration.objects === 'function' ? migration.objects() : migration;

  // 2. Perform the D3 Rollup
  const byOrigin = d3.rollup(
    migrationRows,
    rows => {
      const { origin, year } = rows[0]
      const originScore = happyIndex.get(`${origin}|${year}`)
      if (originScore == null) return null

      const population = popIndex.get(`${origin}|${year}`) ?? null

      let total = 0, toHappier = 0, toSadder = 0, toSadderAdjacent = 0

      for (const r of rows) {
        const destScore = happyIndex.get(`${r.destination}|${r.year}`)
        if (destScore == null) continue
        const isAdjacent = adjacentPairs.has(`${r.origin}|${r.destination}`)
        total += r.migrant_stock
        if (destScore > originScore) toHappier += r.migrant_stock
        if (destScore < originScore) {
          toSadder += r.migrant_stock
          if (isAdjacent) toSadderAdjacent += r.migrant_stock
        }
      }

      if (total === 0) return null
      return {
        origin,
        year,
        originScore,
        population,
        migrantRate:       population != null ? total / population : null,
        total,
        toHappier,
        toSadder,
        toSadderAdjacent,
        pctHappier:        toHappier / total,
        pctSadder:         toSadder  / total,
        pctSadderAdjacent: toSadder > 0 ? toSadderAdjacent / toSadder : null,
      }
    },
    d => d.origin,
    d => d.year
  );

  // 3. Flatten and return the final array
  return [...byOrigin.values()]
    .flatMap(yearMap => [...yearMap.values()])
    .filter(Boolean);
}