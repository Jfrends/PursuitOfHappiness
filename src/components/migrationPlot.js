import * as d3 from "npm:d3";

export function migrationPlot(migrationVsHappiness, width) {
  const height = 500;
  const margin = { top: 40, right: 150, bottom: 50, left: 60 }; 

  // 1. Create tooltip container and styles
  const tooltip = d3.create('div')
    .style('position', 'fixed') 
    .style('visibility', 'hidden')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('border-radius', '6px')
    .style('padding', '10px')
    .style('font-family', 'Avenir, sans-serif')
    .style('font-size', '10pt')
    .style('box-shadow', '0px 4px 12px rgba(0,0,0,0.1)')
    .style('pointer-events', 'none')
    .style('z-index', '10');

  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);

  // 2. Extract Data & Create Scales 
  const rows = migrationVsHappiness.objects();

  const xWithMargin = d3.scaleLog()
    .domain([
      d3.min(rows, d => +d.migration_ratio), 
      d3.max(rows, d => +d.migration_ratio)
    ])
    .range([margin.left, width - margin.right])
    .nice();

  const yWithMargin = d3.scaleLinear()
    .domain([0, 10])
    .range([height - margin.bottom, margin.top]);

  const regions = Array.from(new Set(rows.map(d => d.region))).filter(d => d);
  const colorScale = d3.scaleOrdinal()
    .domain(regions)
    .range(d3.schemeTableau10); 

  // 3. Axes
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yWithMargin));

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(
      d3.axisBottom(xWithMargin)
        .ticks(10)
        .tickFormat(d => {
          const log = Math.log10(d);
          return Math.abs(log - Math.round(log)) < 1e-9 ? d3.format('~g')(d) : "";
        })
    );

  svg.append('line')
    .attr('x1', xWithMargin(0.5)) 
    .attr('x2', xWithMargin(0.5))
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom)
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4 4');

  // 4. Axis Labels
  svg.append('text')
    .attr('text-anchor', 'middle') 
    .attr('x', margin.left + (width - margin.left - margin.right) / 2) 
    .attr('y', height - 10) 
    .attr('font-family', 'Avenir, sans-serif')
    .attr('font-size', '10pt')
    .attr('fill', '#555')
    .text('Migration Ratio');
  
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('y', margin.left - 40) 
    .attr('x', -(margin.top + (height - margin.top - margin.bottom) / 2)) 
    .attr('font-family', 'Avenir, sans-serif')
    .attr('font-size', '10pt')
    .attr('fill', '#555')
    .text('Life Evaluation Score (0 - 10)');

  svg.append('text')
    .attr('text-anchor', 'start') 
    .attr('x', 0) 
    .attr('y', margin.top - 18) 
    .attr('font-weight', 'bold')
    .attr('font-family', 'Avenir')
    .attr('font-size', '11pt')
    .text('Migration Ratio vs Life Evaluation');

  // 5. Legend
  const legend = svg.append('g')
    .attr('class', 'color-legend')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top + 10})`);

  regions.forEach((region, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);

    legendRow.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colorScale(region));

    legendRow.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('font-family', 'Avenir, sans-serif')
      .attr('font-size', '10pt')
      .attr('fill', '#333')
      .text(region);
  });

  // 6. Render Loop (Now only accepts targetYear, since data is bound to the component)
  function render(targetYear) {
    const currentRows = migrationVsHappiness.objects().filter(d => 
      !isNaN(+d.migration_ratio) && 
      !isNaN(+d.life_evaluation) && 
      +d.Year === +targetYear
    );

    svg.selectAll('circle.plot-dot')
      .data(currentRows, d => d['Country name'] || d.name)
      .join(
        enter => enter.append("circle")
          .attr('class', 'plot-dot')
          .attr('cx', d => xWithMargin(+d.migration_ratio))
          .attr('cy', d => yWithMargin(+d.life_evaluation)) 
          .attr('r', 5)
          .attr('fill', d => colorScale(d.region))
          .attr('opacity', 0.7)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .transition().duration(100)
              .attr('r', 8)
              .attr('opacity', 1)
              .attr('stroke', '#333')
              .attr('stroke-width', 1.5);

            const alpha2 = d['alpha-2'] ? d['alpha-2'].toLowerCase() : 'un'; 
            
            tooltip.style('visibility', 'visible')
              .html(`
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                  <div>
                    <strong style="font-size: 11pt; line-height: 1.2;">${d['Country name'] || d.name} (${d.Year})</strong>
                    <div style="color: #666; font-size: 9pt; margin-top: 2px;">${d.region || 'Unknown Region'}</div>
                  </div>
                  
                  <img 
                    src="https://flagcdn.com/w40/${alpha2}.png" 
                    style="width: 32px; height: auto; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); margin-top: 2px;"
                    alt="${d['Country name'] || d.name} flag"
                  />
                </div>
                
                <div style="border-top: 1px solid #eee; margin: 8px 0;"></div>
                
                <div style="margin-bottom: 4px;">Migration Ratio: <strong>${d3.format('.3f')(+d.migration_ratio)}</strong></div>
                <div>Life Evaluation: <strong>${d3.format('.2f')(+d.life_evaluation)}</strong></div>
              `);
          })
          .on('mousemove', function(event) {
            tooltip
              .style('top', (event.clientY + 15) + 'px')
              .style('left', (event.clientX + 15) + 'px');
          })
          .on('mouseleave', function() {
            d3.select(this)
              .transition().duration(100)
              .attr('r', 5)
              .attr('opacity', 0.7)
              .attr('stroke', 'none');

            tooltip.style('visibility', 'hidden');
          }),
        
        update => update.transition().duration(500).ease(d3.easeCubicOut)
          .attr('cx', d => xWithMargin(+d.migration_ratio))
          .attr('cy', d => yWithMargin(+d.life_evaluation)),
  
        exit => exit.remove()
      );
  }

  // 7. Initial Draw
  // Find the minimum year in the dataset to start with
  const minYear = d3.min(rows, d => d.Year);
  render(minYear); 

  const wrapper = d3.create('div').style('position', 'relative');
  wrapper.append(() => svg.node());
  wrapper.append(() => tooltip.node());

  return Object.assign(wrapper.node(), { render });
}