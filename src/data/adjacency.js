import * as aq from "npm:arquero";

export function processAdjacency(rawAdjacencyData) {
  if (!rawAdjacencyData) {
    throw new Error("Missing adjacency data");
  }

  // Convert the raw array into an Arquero table and return it directly
  return aq.from(rawAdjacencyData); 
}