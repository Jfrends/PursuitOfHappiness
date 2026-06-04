import * as aq from "npm:arquero";

export function buildHappy(HAPPINESS) {
  if (!HAPPINESS) {
    throw new Error("Missing input data");
  }

  const happy = HAPPINESS
    .filter(aq.escape(d => d['score'] <= 10)) // TODO CHANGE HARD CODED VALUE
    .orderby("Rank")
    .derive({ name: d => d.country, value: () => 1 })
    .select(["name", 'Year', "value", "score", "delta", "low", "high", "gdp", "socialSupport", "health", "freedom", "generosity", "corruption", "dystopia"])
  
    return happy.objects();
}