import * as aq from "npm:arquero";

export function processNews(rawNewsData) {
  if (!rawNewsData) {
    throw new Error("Missing news data");
  }

  const table = aq.from(rawNewsData)
    .derive({
      // Explicitly cast to numbers
      code:  aq.escape(d => +d.code),
      count: aq.escape(d => +d.count),
      year:  aq.escape(d => +d.year)
    });

  // Return the Arquero table (Removed the redundant aq.from() wrapper)
  return table; 
}