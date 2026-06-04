import * as d3 from 'npm:d3';

export function migrationPlot(migrationVsHappiness, width) {
  const height = 500;
  const margin = { top: 60, right: 150, bottom: 50, left: 60 }; 

  // 1. Metric Configurations (Trimmed to only Migration & GDP)
  const metricsConfig = {
    migration_ratio: { label: 'Migration Ratio', scaleType: 'log', format: d3.format('~g') },
    gdp_per_capita: { label: 'GDP per Capita', scaleType: 'log', format: d3.format(',.0f') }
  };

  const rows = migrationVsHappiness;

  // --- PLAYBACK STATE ---
  let currentMetric = 'migration_ratio';
  let availableYears = [];
  let yearIndex = 0;
  let currentYear = null;
  let playing = false;
  let timer = null;
  const transitionSpeed = 600; // 1 second per step

  // Create UI Container
  const wrapper = d3.create('div')
    .style('position', 'relative')
    .style('font-family', 'Avenir, sans-serif');

  // Add a flex container for ALL controls
  const controls = wrapper.append('div')
    .style('margin-bottom', '15px')
    .style('display', 'flex')
    .style('gap', '15px')
    .style('align-items', 'center')
    .style('padding-left', `${margin.left}px`);

  // --- PLAYBACK UI ---
  const playButton = controls.append('button')
    .text('▶ Play')
    .style('padding', '6px 12px')
    .style('border-radius', '4px')
    .style('border', 'none')
    .style('background', '#007BFF')
    .style('color', '#fff')
    .style('font-weight', 'bold')
    .style('cursor', 'pointer');

  // Add the Scrubber (Range Slider)
  const scrubber = controls.append('input')
    .attr('type', 'range')
    .style('width', '150px')
    .style('cursor', 'pointer')
    .style('accent-color', '#007BFF');

  const yearDisplay = controls.append('div')
    .style('color', '#fff')
    .style('font-size', '16pt')
    .style('font-weight', 'bold')
    .style('min-width', '60px');

  // --- DROPDOWN UI ---
  const dropdownGroup = controls.append('div')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center')
    .style('border-left', '1px solid #444')
    .style('padding-left', '15px')
    .style('padding-right', '20px') // <-- Added right padding here
    .style('margin-left', 'auto'); // Push dropdown to the right

  dropdownGroup.append('span')
    .style('color', '#aaa')
    .style('font-size', '10pt')
    .text('X-Axis Metric:');

  const select = dropdownGroup.append('select')
    .style('padding', '5px 10px')
    .style('border-radius', '4px')
    .style('border', '1px solid #555')
    .style('background', '#222')
    .style('color', '#fff')
    .style('font-size', '10pt');

  select.selectAll('option')
    .data(Object.keys(metricsConfig))
    .join('option')
    .attr('value', d => d)
    .text(d => metricsConfig[d].label);

  // Tooltip container
  const tooltip = wrapper.append('div')
    .style('position', 'fixed')
    .style('visibility', 'hidden')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('border-radius', '6px')
    .style('padding', '10px')
    .style('font-size', '10pt')
    .style('box-shadow', '0px 4px 12px rgba(0,0,0,0.1)')
    .style('pointer-events', 'none')
    .style('z-index', '10')
    .style('color', '#333');

  const svg = wrapper.append('svg')
    .attr('width', width)
    .attr('height', height);

  // Background
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#111');

  // Base Y Scale (Static)
  const yWithMargin = d3.scaleLinear()
    .domain([0, 10])
    .range([height - margin.bottom, margin.top]);

  const regions = Array.from(new Set(rows.map((d) => d.region))).filter((d) => d);
  const colorScale = d3.scaleOrdinal()
    .domain(regions)
    .range(d3.schemeTableau10);

  // Static Y Axis
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yWithMargin))
    .call((g) => g.selectAll('.tick text').attr('fill', 'white'))
    .call((g) => g.selectAll('.domain, .tick line').attr('stroke', 'white'));

  // Placeholders for dynamic X-Axis and Labels
  const xAxisGroup = svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`);

  const xLabel = svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', margin.left + (width - margin.left - margin.right) / 2)
    .attr('y', height - 10)
    .attr('font-size', '10pt')
    .attr('fill', '#fff');

  // Static Titles & Y Label
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', margin.left - 40)
    .attr('x', -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr('font-size', '10pt')
    .attr('fill', '#fff')
    .text('Life Evaluation Score (0 - 10)');

  // Legend
  const legend = svg.append('g')
    .attr('class', 'color-legend')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 10})`);

  regions.forEach((region, i) => {
    const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
    legendRow.append('rect').attr('width', 12).attr('height', 12).attr('rx', 2).attr('fill', colorScale(region));
    legendRow.append('text').attr('x', 20).attr('y', 10).attr('font-size', '10pt').attr('fill', '#fff').text(region);
  });

  // --- TIME MANAGEMENT LOGIC ---
  function updateAvailableYears() {
    const validRows = rows.filter((d) => {
      const xVal = d[currentMetric];
      const yVal = d.life_evaluation;
      if (xVal == null || xVal === "" || yVal == null || yVal === "") return false;
      const xNum = +xVal;
      if (isNaN(xNum) || isNaN(+yVal)) return false;
      if (metricsConfig[currentMetric].scaleType === 'log' && xNum <= 0) return false;
      return true;
    });

    availableYears = Array.from(new Set(validRows.map(d => +d.Year))).sort(d3.ascending);

    if (!availableYears.includes(currentYear)) {
      currentYear = availableYears[availableYears.length - 1]; 
    }
    
    yearIndex = availableYears.indexOf(currentYear);
    yearDisplay.text(currentYear);

    // Update the scrubber bounds based on available data
    scrubber
      .attr('min', 0)
      .attr('max', availableYears.length - 1)
      .property('value', yearIndex);
  }

  // --- RENDER ENGINE ---
  function updateChart() {
    const config = metricsConfig[currentMetric];
    
    // 1. Calculate the GLOBAL extent for the X-axis (keeps the axis static)
    const allValidRows = rows.filter((d) => {
      const xVal = d[currentMetric];
      if (xVal == null || xVal === "") return false;
      const xNum = +xVal;
      if (isNaN(xNum)) return false;
      if (config.scaleType === 'log' && xNum <= 0) return false;
      return true;
    });

    const xExtent = d3.extent(allValidRows, d => +d[currentMetric]);
    if (config.scaleType === 'log' && xExtent[0] <= 0) xExtent[0] = 0.01;

    const xScale = (config.scaleType === 'log' ? d3.scaleLog() : d3.scaleLinear())
      .domain(xExtent)
      .range([margin.left, width - margin.right])
      .nice();

    const xAxisGenerator = d3.axisBottom(xScale).ticks(8);
    if (config.scaleType === 'log') {
      xAxisGenerator.tickFormat(d => {
        const log = Math.log10(d);
        return Math.abs(log - Math.round(log)) < 1e-9 ? config.format(d) : '';
      });
    } else {
      xAxisGenerator.tickFormat(config.format);
    }

    xAxisGroup.transition().duration(500)
      .call(xAxisGenerator)
      .call((g) => g.selectAll('.tick text').attr('fill', 'white'))
      .call((g) => g.selectAll('.domain, .tick line').attr('stroke', 'white'));

    xLabel.text(config.label);

    // 2. Filter for only the CURRENT year for the scatter dots
    const currentRows = allValidRows.filter(d => +d.Year === +currentYear && !isNaN(+d.life_evaluation));

    // Bind Data to Scatter Dots
    svg.selectAll('circle.plot-dot')
      .data(currentRows, (d) => d['Country name'] || d.name)
      .join(
        (enter) => enter.append('circle')
          .attr('class', 'plot-dot')
          .attr('cx', (d) => xScale(+d[currentMetric]))
          .attr('cy', (d) => yWithMargin(+d.life_evaluation))
          .attr('r', 5)
          .attr('fill', (d) => colorScale(d.region))
          .attr('opacity', 0) // Start invisible
          .on('mouseover', function (event, d) {
            d3.select(this).transition().duration(100).attr('r', 8).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 1.5);
            const alpha2 = d['alpha-2'] ? d['alpha-2'].toLowerCase() : 'un';
            
            tooltip.style('visibility', 'visible')
              .html(`
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                  <div>
                    <strong>${d['Country name'] || d.name} (${d.Year})</strong>
                    <div style="color: #666; font-size: 9pt;">${d.region || 'Unknown Region'}</div>
                  </div>
                  <img src="https://flagcdn.com/w40/${alpha2}.png" style="width: 30px; height: auto; border: 1px solid #ddd;"/>
                </div>
                <div style="border-top: 1px solid #eee; margin: 6px 0;"></div>
                <div>${config.label}: <strong>${d3.format(',.3f')(d[currentMetric])}</strong></div>
                <div>Life Evaluation: <strong>${d3.format('.2f')(d.life_evaluation)}</strong></div>
              `);
          })
          .on('mousemove', function (event) {
            tooltip.style('top', (event.clientY + 15) + 'px').style('left', (event.clientX + 15) + 'px');
          })
          .on('mouseleave', function () {
            d3.select(this).transition().duration(100).attr('r', 5).attr('opacity', 0.7).attr('stroke', 'none');
            tooltip.style('visibility', 'hidden');
          })
          .call(enter => enter.transition().duration(transitionSpeed).attr('opacity', 0.7)),
        
        (update) => update.transition().duration(transitionSpeed).ease(d3.easeLinear) 
          .attr('cx', (d) => xScale(+d[currentMetric]))
          .attr('cy', (d) => yWithMargin(+d.life_evaluation)),
        
        (exit) => exit.transition().duration(transitionSpeed / 2).attr('opacity', 0).remove()
      );
  }

  // --- EVENT LISTENERS ---
  select.on('change', function() {
    currentMetric = this.value;
    updateAvailableYears();
    updateChart();
  });

  // Handle manual scrubbing
  scrubber.on('input', function() {
    if (playing) {
      playing = false;
      playButton.text('▶ Play').style('background', '#007BFF');
      if (timer) timer.stop();
    }
    yearIndex = +this.value;
    currentYear = availableYears[yearIndex];
    yearDisplay.text(currentYear);
    
    // Use a faster transition when manually scrubbing for snappier feedback
    svg.selectAll('circle.plot-dot')
       .transition().duration(200).ease(d3.easeCubicOut)
       .attr('cx', (d) => {
         const config = metricsConfig[currentMetric];
         const allValidRows = rows.filter((r) => r[currentMetric] != null && r[currentMetric] !== "");
         const xExtent = d3.extent(allValidRows, r => +r[currentMetric]);
         if (config.scaleType === 'log' && xExtent[0] <= 0) xExtent[0] = 0.01;
         const xScale = (config.scaleType === 'log' ? d3.scaleLog() : d3.scaleLinear())
           .domain(xExtent).range([margin.left, width - margin.right]).nice();
         return xScale(+d[currentMetric]);
       })
       .attr('cy', (d) => yWithMargin(+d.life_evaluation));
       
    updateChart();
  });

  function stepForward() {
    yearIndex++;
    if (yearIndex >= availableYears.length) {
      playing = false;
      playButton.text('▶ Play').style('background', '#007BFF');
      if (timer) timer.stop();
      return;
    }
    currentYear = availableYears[yearIndex];
    yearDisplay.text(currentYear);
    scrubber.property('value', yearIndex); // Sync scrubber handle with animation
    updateChart();
  }

  playButton.on('click', () => {
    if (playing) {
      // Pause
      playing = false;
      playButton.text('▶ Play').style('background', '#007BFF');
      if (timer) timer.stop();
    } else {
      // Play
      playing = true;
      playButton.text('⏸ Pause').style('background', '#dc3545');
      
      // If at the end, restart from the beginning
      if (yearIndex >= availableYears.length - 1) {
        yearIndex = -1; 
      }
      
      stepForward(); // Take first step instantly
      timer = d3.interval(stepForward, transitionSpeed + 100); 
    }
  });

  // --- INITIALIZATION ---
  function render() {
    updateAvailableYears();
    updateChart();
  }

  render();

  return Object.assign(wrapper.node(), { render });
}