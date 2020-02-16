import React, { useState, useEffect, useCallback } from 'react';
import './Chart.css';
import data from './data';
import { select, scaleLinear, max, sum, axisLeft, axisBottom, event, line } from 'd3';

export default function Chart() {
  const [dataState, setDataState] = useState([]);
  const [margin, setMargin] = useState({});
  const [chartWidth, setChartWidth] = useState(null);
  const [chartHeight, setChartHeight] = useState(null);
  const [summaryWidth, setSummaryWidth] = useState(null);
  const [summaryHeight, setSummaryHeight] = useState(null);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [tooltipPadding, setTooltipPadding] = useState({});

  let dataChart;
  let dataSummary;

  const render = useCallback((data = []) => {
    if (chartWidth) {
      const chartTitle = 'Percent Value vs Category';
      const totalValue = sum(data, d => d.value);
      const xValue = d => d.category;
      const yValue = d => (d.value / totalValue) * 100;

      const innerWidth = chartWidth - margin.left - margin.right;
      const innerHeight = chartHeight - margin.top - margin.bottom;

      const xScale = scaleLinear()
        .domain([0, max(data, xValue)])
        .range([0, innerWidth]);

      const yScale = scaleLinear()
        .domain([sum(data, yValue), 0])
        .range([0, innerHeight]);

      const xAxis = axisBottom(xScale);

      const yAxis = axisLeft(yScale)
        .tickFormat(n => `${n}%`)
        .tickSize(-innerWidth);

    
      const g = dataChart.append('g')
        .attr('class', 'lineChart')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .on('mousemove', () => {
          const xPos = event.offsetX;
          const yPos = event.offsetY;
          xCursorLine.attr('transform', `translate(0,${yPos - margin.top})`);
          yCursorLine.attr('transform', `translate(${xPos - margin.left},0)`);
        });

        g.append('g')
          .append('text')
          .attr('id', 'chartTitle')
          .attr('transform', `translate(${innerWidth / 2 - 100},${-margin.top / 2})`)
          .text(chartTitle);

        g.append('g').call(yAxis)
          .selectAll('.domain')
          .remove();

        g.append('g').call(xAxis)
          .attr('transform', `translate(0,${innerHeight})`)
          .selectAll('.domain, line')
          .remove();
      
        const cursorCrossline = g.append('g')
          .attr('id', 'crosslineGroup');

          const xCursorLine = cursorCrossline.append('line')
            .attr('id', 'xCursorLine')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', innerWidth)
            .attr('y2', 0)
            .style('stroke', '#888888')
            .style('stroke-width', 1);

          const yCursorLine = cursorCrossline.append('line')
            .attr('id', 'yCursorLine')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', innerHeight)
            .style('stroke', '#888888')
            .style('stroke-width', 1);

        const drawLine = line()
                      .x(d => xScale(xValue(d)))
                      .y(d => yScale(yValue(d)));

        g.append('path')
          .attr('d', drawLine(data))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('fill', 'none');

        g.selectAll('circle')
          .data(data)
          .enter()
          .append('circle')
          .attr('class', 'circlePoint')
          .attr('cy', d => yScale(yValue(d)))
          .attr('cx', d => xScale(xValue(d)))
          .attr('r', 6)
          .on('mouseover', () => {
            setTooltipWidth(document.getElementById('tooltipText').getBoundingClientRect().x);
            tooltip.style('display', null);
          })
          .on('mouseout', () => {
            tooltip.style('display', 'none');
          })
          .on('mousemove', d => {
            const xPos = event.offsetX;
            const yPos = event.offsetY;
            tooltip.attr('transform', `translate(${xPos - margin.left + 10},${yPos - margin.top - tooltipPadding.top - 16})`)
              .select('text')
              .text(`Name: ${d.user}`)
              .attr('transform', `translate(${tooltipPadding.left},0)`);
          });

        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('id', 'tooltip')
          .style('display', 'none');

          tooltip.append('rect')
            .attr('class', 'tooltipBox')
            .attr('width', tooltipWidth)
            .attr('height', 20 + tooltipPadding.top + tooltipPadding.bottom)
            .attr('transform', `translate(0,${-20 - tooltipPadding.top / 2})`);

          tooltip.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('class', 'tooltipText')
            .attr('id', 'tooltipText')
            .style('font-size', '1em')
            .style('font-weight', 'bold');
        
      
    }
  }, [chartWidth, 
      margin.left, 
      margin.right, 
      margin.top, 
      margin.bottom, 
      chartHeight, 
      dataChart, 
      tooltipWidth, 
      tooltipPadding.top, 
      tooltipPadding.bottom, 
      tooltipPadding.left]);

  const updateTooltipWidth = useCallback(id => {
    if (!document.getElementById(id)) return;
      setTooltipWidth(document.getElementById(id).clientWidth);
      select('rect.tooltipBox')
        .attr('width', tooltipWidth + tooltipPadding.left + tooltipPadding.right)
        .attr('transform', `translate(0,${-20 - tooltipPadding.top / 2})`);
    
  }, [tooltipPadding.left, tooltipPadding.right, tooltipPadding.top, tooltipWidth]);


  useEffect(() => {
    setDataState(data);
    return () => {};
  }, [])

  useEffect(() => {
    /*** Set initial state ***/
    console.log('Data state updated.', dataState);
    setMargin({ top: 40, right: 40, bottom: 40, left: 40 });
    dataChart = select('svg#dataChart');
    dataSummary = select('svg#dataSummary');
    setChartWidth(+dataChart.attr('width'));
    setChartHeight(+dataChart.attr('height'));
    setSummaryWidth(+dataSummary.attr('width'));
    setSummaryHeight(+dataSummary.attr('height'));
    setTooltipPadding({ top: 10, right: 20, bottom: 10, left: 20 });
    /*** Re-render when data updated ***/
    render(dataState);
    return () => {};
  }, [dataState])

  useEffect(() => {
    updateTooltipWidth('tooltipText');
    return () => {};
  }, [tooltipWidth, updateTooltipWidth])


  return (
    <div>
      <svg id='dataChart' width='960' height='600'></svg>
      <svg id='dataSummary' width='960' height='100'></svg>
    </div>
  )
}
