import * as aq from "npm:arquero";

export function processPopulation(rawPopulationData) {
  if (!rawPopulationData) {
    throw new Error("Missing population data");
  }

  const table = aq.from(rawPopulationData)
    .derive({
      // Explicitly cast to numbers (though { typed: true } usually handles this!)
      year:       aq.escape(d => +d.year),
      population: aq.escape(d => +d.population),
    });

  // Return the Arquero table (Removed the redundant aq.from() you had in the original)
  return table; 
}