---
toc: false
---

<div class="hero">
  <h1>Chasing Happiness</h1>
  <h2><h2>Exploring how national happiness varies across the world, how people migrate through that landscape, and whether migration patterns tend to point toward countries with higher reported well-being.</h2></h2>
</div>

<section class="intro-card">
  <p>
    We often hear of happiness as a personal feeling, something to attain, and it is simply found in ones personal way of living. However, national life evaluation scores show that well-being also has a geographic and social pattern. Some countries consistently report higher average life satisfaction than others, and those differences raise an important question: how do people move through a world filled with so many discrepencies?
  </p>

  <p>
    This article explores the relationship between national happiness and international migration. We use life evaluation scores from the World Happiness Report, where respondents rate their lives on a 0–10 scale. We then compare those scores with international migrant stock data showing where migrants live relative to their countries of origin.
  </p>

  <p>
    Rather than claiming that happiness directly causes migration, we ask a more careful question: when people move across borders, are they moving toward countries with higher reported well-being?
  </p>
</section>

<section class="section-grid">

<div class="section-copy">

<h2>Happiness Flows Overview</h2>

<p>To begin, we compare international migrant stock by whether migrants are living in countries with higher or lower life evaluation scores than their countries of origin. In this chart, movement “toward happier countries” means that the destination country has a higher World Happiness Report life evaluation score than the origin country. Movement “toward less happy countries” means that the destination country has a lower life evaluation score than the origin country.</p>

<p><strong>Takeaway:</strong> In the joined dataset, migrant stock toward happier countries is about 3.8× larger than migrant stock toward less happy countries.</p>

<p>The chart shows an aggregate association between the happiness rating and migration: migration is not evenly distributed across the global happiness landscape. Countries with higher life evaluations are likely to contain also have other conditions that attract migrants, such as stronger economies, greater political stability, or safer living conditions</p>

</div>

<div class="card dark-chart-card">

```js
import { simpleBar } from "./components/simpleBar.js";
import { buildHappinessFlows } from "./data/happinessFlows.js"; 

const migrationData = await FileAttachment("./data/migration.csv").csv({ typed: true });
const happinessData = await FileAttachment("./data/happiness2026.csv").csv({ typed: true });

const flowsData = buildHappinessFlows({ migrationData, happinessData });

display(await simpleBar(flowsData, width));
```

</div>

</section>



---

## Regional & Adjacent Disparities

While global trends tell one story, regional neighbors often have stark contrasts. The chart below examines countries alongside their geographic neighbors to identify localized migration drivers.

This chart breaks migration into four categories: people staying within the same country, people moving to a happier country, people moving to a less happy adjacent country, and people moving to a less happy non-adjacent country. The adjacent/non-adjacent distinction is significant because nearby countries can differ heavily in life evaluation, despite being connected by borders. A move to a neighboring country with a lower happiness score does not necessarily imply that it is irrational; it may still reflect things like lower travel costs, easier entry, temporary displacement, and others. By separating adjacent and non-adjacent movement, the chart shows that migration can be understood both geographically and statistically: that the direction of movement is related to happiness differences and also proximity. 

<div class="card" style="display: flex; justify-content: center; background: #111; overflow: visible;">

```js
import { AdjacentPlot } from "./components/adjacentPlot.js";
import { processAdjacent } from "./data/adjacent.js"; 
import { processAdjacency } from "./data/adjacency.js";
import { buildHappy } from "./data/happy.js"; 
import { processHappiness } from "./data/processHappiness.js";
import { processPopulation } from "./data/population.js";
import { buildMigration } from "./data/migration.js";

const MIGRATION = await FileAttachment("./data/migration.csv").csv({ typed: true });
const migration = buildMigration(MIGRATION);

const rawPopData = await FileAttachment("./data/population.csv").csv({ typed: true });
const POPULATION = processPopulation(rawPopData);

const rawHappinessData = await FileAttachment("./data/happiness2026.csv").csv({ typed: true });
const HAPPINESS = processHappiness(rawHappinessData);
const happy = buildHappy(HAPPINESS);

const rawAdjData = await FileAttachment("./data/adjacency.csv").csv({ typed: true });
const ADJACENCY = processAdjacency(rawAdjData);

const adjacent = processAdjacent({happy, POPULATION, ADJACENCY, migration});

const selectedYear = 2024; 

// Pass width and year inside an object
display(AdjacentPlot(adjacent, { width: width, year: selectedYear }));
```

</div>

---

## The Happiness Distribution

How wide is the gap between the happiest and least happy populations? This candle chart visualizes the distribution and variance of life evaluation scores across different regions.

Each of the candlesticks in this chart summarizes the distribution of country-level life evaluation scores for a single year from 2011 to 2025. The thin vertical line shows the full range from the lowest-scoring country from Q1 to Q3, and the black dot marks the median country score. The color indicates whether the overlal distribution improved or declined compared with the previous year.

Reading across years shows that global happiness is not evenly distributed, but the center of the distribution gradually trends upwards. The median life evaluation score rises over time, and the upper quartile also moves higher. The long vertical ranges show that the gab between the highest and lowest-scoring coutnreis remain large in every year. As the typical country improves, global happiness inequality does not seem to disappear. 

<div class="card" style="display: flex; justify-content: center; background: #111; overflow: visible;">

```js
import { CandleChart } from "./components/candleChart.js";
import { buildHappy } from "./data/happy.js"; 
import { processHappiness } from "./data/processHappiness.js";

// Load the raw data file
const rawHappinessData = await FileAttachment("./data/happiness2026.csv").csv({ typed: true });

// Process it into the finalized HAPPINESS table
const HAPPINESS = processHappiness(rawHappinessData);
const happy = buildHappy(HAPPINESS);

// Pass the processed data to the chart
display(await CandleChart(happy, width));
```

</div>

---

## Connecting Migration to Happiness

By directly plotting migration volumes against happiness scores, we can see if the expected correlation holds true. Does a higher happiness score reliably predict a higher net influx of migrants?

*(Placeholder: Discuss the outliers in this scatter/migration plot. Are there incredibly happy countries with low immigration, or unhappy countries experiencing an unexpected influx?)*


<div class="card" style="display: flex; justify-content: center; background: #111; overflow: visible;">

```js
import { migrationPlot } from "./components/migrationPlot.js";
import { buildMigrationVsHappiness } from "./data/migrationVsHappiness.js"

const migData = await FileAttachment("./data/migration.csv").csv({ typed: true });
const happinessData = await FileAttachment("./data/happiness2026.csv").csv({ typed: true });
const countryData = await FileAttachment("./data/country_codes.csv").csv({ typed: true });

// Process the raw datasets into the flows array
const mvh = buildMigrationVsHappiness({ migData, happinessData, countryData });

// Pass the processed data to the chart
display(await migrationPlot(mvh, width));
```

</div>

---

## Interactive Global Explorer

Explore the data yourself. Use the interactive 3D globe below to select individual countries, view their specific happiness scores, and trace the direct migration vectors into and out of their borders.

*(Placeholder: Give the user brief instructions. e.g., "Hover over a country to see its score, click to lock it in and view migration vectors, and use the search bar to find a specific nation.")*

<div class="card" style="display: flex; justify-content: center; background: #111; position: relative;">

```js
// IMPORTS
import * as d3 from "npm:d3";
import * as topojson from "npm:topojson-client";
import { Graph } from "./components/Graph.js";
import { Search } from "./components/Search.js";

import { buildHappy } from "./data/happy.js"; 
import { processHappiness } from "./data/processHappiness.js";
import { buildMigration } from "./data/migration.js";

// LOAD DATA
const TOPO = ({
  low:   await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then(r => r.json()),
  high:  await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json())
});

const GLOBE = {
  countries: topojson.feature(TOPO.high, TOPO.high.objects.countries),
  borders: topojson.mesh(TOPO.high, TOPO.high.objects.countries, (a, b) => a !== b)
};

const rawHappinessData = await FileAttachment("./data/happiness2026.csv").csv({ typed: true });
const HAPPINESS = processHappiness(rawHappinessData);
const happy = buildHappy(HAPPINESS);

const MIGRATION = await FileAttachment("./data/migration.csv").csv({ typed: true });
const migration = buildMigration(MIGRATION);

// BUILD CONFIG
const preview = { 
  width: width * 0.6,   // 1. Shrink the overall canvas to 70%
  height: width * 0.6,  // 2. Keep it square
  radius: (width * 0.6) / 2, // 3. Base the radius on the new smaller width
  gap: 20 
};

const variables = {
  background: { color: '#111111' },
  globe: {
    start: [-95, -38, 0], 
    radius: (preview.radius * 0.55) - preview.gap,
    border: preview.gap,
    colors: {
      ocean: '#0A1628', land: '#1A4D2E', borders: '#FFFFFF26',
      graticule: '#FFFFFF1A', atmosphere: '#378ADD', hovered: '#FFFFFF',
      selected: '#FFFFFF', outline: '#FFFFFF', scale: ['#272727', '#FFD700'] 
    },
    stroke: { outline: 3.5, borders: 0.5, graticule: 0.5, opacity: 0.75 }
  },
  rays: {
    radius: { 
      inner: preview.radius * 0.55, // Keeps the rays touching the globe
      // 1. CHANGE THIS: Bring the outer edge inward (e.g., multiply by 0.8)
      outer: preview.radius * 0.8 
    },
    angle: 0.005,
    fonts: { labels: { size: 16 } },
    scale: {
      // 2. CHANGE THIS: Make sure the D3 scale matches your new outer limit
      function: d3.scaleLinear().domain([0, 10]).range([preview.radius * 0.55, preview.radius * 0.8]),
      domain: [2, 10], values: [2, 4, 6, 8, 10], offset: 14
    },
    colors: {
      rays: { active: ['#F5C036', '#FBE08A', '#DFA020'], inactive: ['#8A8A8A', '#D4D4D4', '#737373'] },
      scale: ["#BBBBBB", "#444444"], error: '#AAAAAA', labels: '#111111', hovered: '#f73b2e'
    },
    stroke: {
      rays: { width: 0.8, opacity: 0.6, fill: 0.82 },
      error: { opacity: 0.8 }, scale: { width: 0.5, style: [3, 4] }, labels: { width: 0.5 }
    }
  },
  bars: {
    colors: [ 
      { key: "gdp", color: "#e63946" }, { key: "socialSupport", color: "#f4a261" },
      { key: "health", color: "#2a9d8f" }, { key: "freedom", color: "#457b9d" },
      { key: "generosity", color: "#a8dadc" }, { key: "corruption", color: "#e9c46a" },
      { key: "dystopia", color: "#8ecae6" } 
    ]
  },
  vectors: { density: 5, weightRange: [0.5, 16] },
  triangles: { increase: '#4CAF50', decrease: '#F44336' } 
};

const config = { preview, variables, TOPO, GLOBE };

// INITIALIZE AND RENDER
const myDashboard = new Graph(happy, migration, 2024, config);
const searchBar = new Search(myDashboard.globe, myDashboard.svg.node().parentNode, config);

display(myDashboard.svg.node());
```

</div>

-- 

## How National Condititons Connect with Happiness

TENTATIVE SUMMARY DON"T KNOW WHAT WILL GO HERE 

The visualizations of migration shows that the migrant stock is often directed toward countries with higher reports of well-being, but they do not explain why those countries score higher. 

To better understnad what happiness scores may represent, we cmpare life evaluation with country-level conditions commonly discussed in the World Happiness Report, including economic output, life expectancy.....? etc



<style>


/* Dashboard Hero Styling */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 4rem 0 4rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

.section-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(520px, 1.4fr);
  gap: 2rem;
  align-items: center;
  margin: 3rem 0 4rem;
}

.section-copy {
  max-width: 42rem;
}

.section-copy p {
  line-height: 1.65;
}

.section-copy strong {
  color: #f5c036;
}
@media (max-width: 900px) {
  .section-grid {
    grid-template-columns: 1fr;
  }
}

.dark-chart-card {
  display: flex;
  justify-content: center;
  background: #111;
  overflow: visible;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #2a2a2a;
}
.intro-card {
  max-width: 850px;
  margin: -1.5rem auto 4rem;
  padding: 1.5rem 1.75rem;
  border-left: 4px solid #f5c036;
  background: rgba(255, 255, 255, 0.035);
  border-radius: 12px;
  color: var(--theme-foreground);
}

.intro-card p {
  margin: 0 0 1rem;
  line-height: 1.7;
  font-size: 17px;
}

.intro-card p:last-child {
  margin-bottom: 0;
  color: #f5c036;
  font-weight: 650;
}


@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}
</style>