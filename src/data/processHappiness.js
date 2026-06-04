import * as aq from "npm:arquero";
import { countryFix as NAMEFIX } from "./countryFix.js"; 

export function processHappiness(rawHappinessData) {
  // 1. Convert the raw data to an Arquero table ONCE
  let table = aq.from(rawHappinessData);

  // 2. Dynamically cast all columns (except Country name) to numbers
  const colsToCast = table.columnNames().filter(c => c !== "Country name");
  
  table = table
    .derive(
      Object.fromEntries(
        colsToCast.map(c => [c, aq.escape(d => +d[c])])
      )
    )
    .rename({
      "Country name": "country",
      "Life evaluation (3-year average)": "score",
      "Lower whisker": "low",
      "Upper whisker": "high",
      "Explained by: Log GDP per capita": "gdp",
      "Explained by: Social support": "socialSupport",
      "Explained by: Healthy life expectancy": "health",
      "Explained by: Freedom to make life choices": "freedom",
      "Explained by: Generosity": "generosity",
      "Explained by: Perceptions of corruption": "corruption",
      "Dystopia + residual": "dystopia"
    })
    .derive({
      country: aq.escape(d => NAMEFIX[d.country] ?? d.country)
    });

  // 3. Extract to standard array to calculate the year-over-year deltas
  const rows = table.objects();

  const byCountryYear = new Map(
    rows.map(d => [`${d.country}|${d.Year}`, d.score])
  );

  // 4. Return the final, enhanced Arquero table
  return aq.from(rows.map(d => {
    const prevScore = byCountryYear.get(`${d.country}|${d.Year - 1}`) ?? null;

    return {
      ...d,
      prevScore,
      delta: prevScore == null ? null : d.score - prevScore
    };
  }));
}