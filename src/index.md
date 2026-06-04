---
toc: true
---

<style>
  #observablehq-main .hero h2 {
    max-width: none;
    width: 100%;
  }

  .intro-card p {
    max-width:      none;
    text-align:     justify;
    padding-left:   2rem;
    padding-right:  2rem;
  }

  .section-copy p {
    text-align:     justify;
  }

  .globe-instructions p {
    max-width: none;
    text-align: center;
    color: var(--theme-foreground-muted);
    font-size: 14px;
  }
</style>

<div class="hero">
  <h1>The Pursuit of Happiness</h1>
  <h2>Exploring how happiness varies across the world & how people navigate through that landscape.</h2>
</div>

<div class="hero">
</div>

<section class="intro-card">
  <p>
    We often hear of happiness as a personal feeling, something to attain, and it is simply found in ones personal way of living. However, national life evaluation scores show that that well-being also has a distinctly geographic and social pattern. Some countries consistently report higher average life satisfaction than others, and those differences raise an important question: how do people move through a world filled with so many disparities?
  </p>

  <p>
    This article explores the relationship between national happiness and international migration. We use life evaluation scores from the World Happiness Report, where respondents rate their lives on a 0–10 scale. We then compare those scores with international migration data, seeing where people choose to go in ...
  </p>

  <p>
  <i>... the pursuit of happiness</i>.
  </p>
</section>

<div class="hero">
</div>

<div class="hero">
</div>

<section class="section-grid">

<div class="section-copy">

## Migration Flow
<p></p>
<p>We compare international migrant stock by whether migrants are living in countries with higher or lower life evaluation scores than their countries of origin to start. In this chart, movement “toward happier countries” means that the destination country has a higher World Happiness Report life evaluation score than the origin country. Movement “toward less happy countries” means that the destination country has a lower life evaluation score than the origin country.</p>
<p></p>
<p><strong>Migration happens towards <i>happier</i> countries at about at nearly <u>four times greater a rate</u> than towards <i>less happy</i> countries.</strong></p>
<p></p>
<p>The chart shows an hints at a strong association between the happiness rating and migration—at least <i>in aggregate</i>. [1] [5]</p>

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

<section class="section-grid">

<div class="section-copy">
  <h2>Migration Direction by Country</h2>
  <p></p>
  <p> Shown here is percentages of population migrating for each country in 2024, sorted from country with the lowest life evaluation score at the top to the highest at the bottom. Percentage of movement to less happy countries is also further broken out into immediately adjacent and non-immediately adjacent countries.</p>
  <p></p>
  <p><strong>The lower the life evluation seen, the greater the choice is clear: a <i>happier country</i> or an <i>immediately adjacent country</i>. For happier countries, the choice of movement doesn't seem to be nearly as limited by adjacency. [1] [3] [5]</strong></p>
</div>

<div class="card dark-chart-card">

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

</section>

---
<div class="hero">
</div>
<div class="hero">
</div>

<section class="section-grid">
<div class="section-copy">
<h2>Happiness Over Time</h2>
<p>
  How wide has the gap been between the happiest and least happy populations, over the years? Sometimes something as simple as distribution over time can show <i>shifts</i>.
  </p>
<p>
  Here a stock market chart shows distribution, with the thin white bar representing the range from lowest to highest score, the pill representing the quartile range, and the dot representing median happiness. [1]
</p>
<p>
  <strong>See if you can tell which year 2019 is. Hover to see change in median and low values over time.</strong>
</p>
</div>

<div class="card dark-chart-card">

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
</section>

<div class="hero">
</div>
<div class="hero">
</div>

---

<div class="hero">
</div>
<div class="hero">
</div>

<section class="intro-card">
  <h2>Migration Ratio and National Conditions</h2>
  <p>
    We have argued so far that people are in fact moving towards happier areas, but what makes a country happy? This scatter plot allows you to explore a few of the various factors that impact how happy a country and discover how they have changed, or remained the same, over time. 
  </p>

  <p>
    Move the scrubber or press the play button to scroll through the years worth of data and use the dropdown menu to select which variable's relationship with happiness you would like to explore.
  </p>

  <p>
    Select between GDP, Life Expectency, Economic Inequality, Migration Ratio, and Trust metrics to discover what makes a country happy. 
  </p>
</section>


<div class="card" style="display: flex; justify-content: center; background: #111; overflow: visible;">


```js
import { migrationPlot } from "./components/migrationPlot.js";

// Load the pre-processed data outputted by the data loader
const mvhData = await FileAttachment("./data/migration_vs_happiness_clean.csv").csv({ typed: true });

// Pass directly to the chart
display(migrationPlot(mvhData, width));
```
</div>

<div class="globe-instructions">

Sources: [1] [2] [3] [4] [6] [7] [8]

</div>

<div class="hero">
</div>

<div class="hero">
</div>

---

## Interactive Exploration

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
  width: width,   // 1. Shrink the overall canvas to 70%
  height: width * 0.7,  // 2. Keep it square
  radius: (width * 0.6) / 2, // 3. Base the radius on the new smaller width
  gap: 3 
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
      outer: preview.radius 
    },
    angle: 0.005,
    fonts: { labels: { size: 16 } },
    scale: {
      // 2. CHANGE THIS: Make sure the D3 scale matches your new outer limit
      function: d3.scaleLinear().domain([0, 10]).range([preview.radius * 0.55, preview.radius]),
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

<div class="globe-instructions">

*Two finger pan to rotate the globe  |  Pinch to zoom and for selection reticule  |  Hover for country name  |  Click countries for history  |  Rotate or click to change year  |  Select blue years for migration data  |  Double click to reset* [1]

</div>

---


<section class="intro-card">
  <p>
    It's all too easy to get lost in arguments surrounding immigration over <i>should</i> and <i>could</i>, <i>pro</i> and <i>con</i>, <i>this side</i> or <i>that</i>. All of these things get away from the simple truth that people largely chase happiness (or at least, escape from unhappiness), as seen above. And that happiness is tied to many separate characteristics of a country, all of which come together to form a country's happiness—not always in equal proportions and not always fully formed by these metrics.
  </p>

  <p>
    This, the takeaway from this graphic is simple: Remember <i>why</i> people move: for reasons we hold to be self-evident—for reasons we hold to be <i>unalienable</i>. <i>Life</i>, <i>liberty</i>, and ...
  </p>

  <p>
  <i>... the pursuit of happiness</i>.
  </p>
</section>


[1] [World Happiness Report](https://data.worldhappiness.report/)  
[2] [United Nations](https://www.un.org/development/desa/pd/content/international-migrant-stock)  
[3] [World Bank](https://data.worldbank.org/indicator/SP.POP.TOT)  
[4] [World Bank](https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.KD)  
[5] [P1sec/country_adjacency](https://github.com/P1sec/country_adjacency)  
[6] [OurWorldInData](https://ourworldindata.org/economic-inequality)  
[7] [OurWorldInData](https://ourworldindata.org/life-expectancy)  
[8] [OurWorldInData](https://ourworldindata.org/trust)  
  
---

<section class="sources-card" id="sources">
  <h2>Sources</h2>

  <ol>
    <li>
      <a href="https://data.worldhappiness.report/" target="_blank" rel="noopener noreferrer">World Happiness Report</a>
      <span>Life evaluation scores and happiness-related indicators used to measure national well-being on a 0–10 scale.</span>
    </li>
    <li>
      <a href="https://www.un.org/development/desa/pd/content/international-migrant-stock" target="_blank" rel="noopener noreferrer">United Nations International Migrant Stock</a>
      <span>Country-to-country migrant stock data used to compare origin and destination countries.</span>
    </li>
    <li>
      <a href="https://data.worldbank.org/indicator/SP.POP.TOT" target="_blank" rel="noopener noreferrer">World Bank Population, Total</a>
      <span>Population totals used to normalize migration measures by country size.</span>
    </li>
    <li>
      <a href="https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.KD" target="_blank" rel="noopener noreferrer">World Bank GDP per Capita</a>
      <span>GDP per capita indicator used as one national condition associated with life evaluation.</span>
    </li>
    <li>
      <a href="https://github.com/P1sec/country_adjacency" target="_blank" rel="noopener noreferrer">P1sec Country Adjacency Dataset</a>
      <span>Country adjacency data used to classify migration toward adjacent versus non-adjacent destinations.</span>
    </li>
    <li>
      <a href="https://ourworldindata.org/economic-inequality" target="_blank" rel="noopener noreferrer">Our World in Data: Economic Inequality</a>
      <span>Background and data context for income inequality and the Gini coefficient.</span>
    </li>
    <li>
      <a href="https://ourworldindata.org/life-expectancy" target="_blank" rel="noopener noreferrer">Our World in Data: Life Expectancy</a>
      <span>Background and data context for life expectancy as a national condition.</span>
    </li>
    <li>
      <a href="https://ourworldindata.org/trust" target="_blank" rel="noopener noreferrer">Our World in Data: Trust</a>
      <span>Background and data context for interpersonal trust.</span>
    </li>
    <li>
      <a href="https://d3js.org/" target="_blank" rel="noopener noreferrer">D3.js</a>,
      <a href="https://observablehq.com/plot/" target="_blank" rel="noopener noreferrer">Observable Plot</a>,
      and
      <a href="https://observablehq.com/framework/" target="_blank" rel="noopener noreferrer">Observable Framework</a>
      <span>Visualization libraries and publishing tools used to build the interactive article.</span>
    </li>
  </ol>
</section>


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
  background: linear-gradient(30deg, #f5c036, #fffbe6);
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

.candle-section {
  align-items: center;
}

.callout-card {
  padding: 1.5rem 1.75rem;
  border-left: 4px solid #f5c036;
  background: rgba(255, 255, 255, 0.035);
  border-radius: 12px;
}

.callout-card h2 {
  margin-top: 0;
}

.callout-card p {
  line-height: 1.7;
}

.dark-chart-card svg {
  max-width: 100%;
  height: auto;
}
.sources-card {
  max-width: 900px;
  margin: 2rem auto 5rem;
  padding: 1.5rem 1.75rem;
  border-left: 4px solid #f5c036;
  background: rgba(255, 255, 255, 0.035);
  border-radius: 12px;
  color: var(--theme-foreground);
}

.sources-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.sources-card ol {
  margin: 0;
  padding-left: 1.5rem;
}

.sources-card li {
  margin-bottom: 0.9rem;
  line-height: 1.6;
}

.sources-card li span {
  display: block;
  color: var(--theme-foreground-muted);
  margin-top: 0.2rem;
}

.sources-card a {
  color: #f5c036;
  font-weight: 700;
  text-decoration: none;
}

.sources-card a:hover {
  text-decoration: underline;
}


@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}
</style>