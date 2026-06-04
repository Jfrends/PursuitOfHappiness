import * as aq from "npm:arquero";

export function processGdp(rawGdpData) {
  if (!rawGdpData) {
    throw new Error("Missing GDP data");
  }

  const table = aq.from(rawGdpData)
    .derive({
      // Explicitly cast to numbers
      year:  aq.escape(d => +d.year),
      gdppc: aq.escape(d => +d.gdppc),
    });

  // Return the Arquero table (Removed the redundant aq.from() wrapper)
  return table; 
}