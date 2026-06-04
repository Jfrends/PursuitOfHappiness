import * as aq from "npm:arquero";
// 1. FIXED: Added the missing import for NAMEFIX
import { countryFix as NAMEFIX } from "./countryFix.js";

// 2. FIXED: Removed the curly braces around MIGRATION
export function buildMigration(MIGRATION) {
  if (!MIGRATION) {
    throw new Error("Missing input data");
  }

  const migration = aq.from(MIGRATION)
    .derive({
        dest_code:      d => +d.dest_code,
        origin_code:    d => +d.origin_code,
        year:           d => +d.year,
        migrant_stock:  d => +d.migrant_stock
    })
    .filter(aq.escape(d => d.year >= 2011))
    .filter(aq.escape(d => d.sex === 'both'))
    .select(['origin', 'destination', 'migrant_stock', 'year'])
    .objects()
    .map(d => ({
      ...d,
      year:        +d.year,
      origin:      NAMEFIX[d.origin]      ?? d.origin,
      destination: NAMEFIX[d.destination] ?? d.destination,
    }));

  return migration;
}