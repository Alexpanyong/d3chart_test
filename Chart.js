import React, { useState, useEffect, useCallback } from 'react';
import './Chart.css';
import data from './data';
import { select, scaleLinear, min, max, sum, axisLeft, axisBottom, format, event, line, drag } from 'd3';
import _ from 'lodash';

export default function Chart() {
  const [dataState, setDataState] = useState([]);
  const [margin, setMargin] = useState({});
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);
  const [innerChartWidth, setInnerChartWidth] = useState(0);
  const [innerChartHeight, setInnerChartHeight] = useState(0);
  const [summaryWidth, setSummaryWidth] = useState(0);
  const [summaryHeight, setSummaryHeight] = useState(0);
  const [tooltipWidth, setTooltipWidth] = useState(0);
  const [tooltipPadding, setTooltipPadding] = useState({});
  const [categories, setCategories] = useState([]);
  const [cateInRange, setCateInRange] = useState([]);
  const [filteredCate, setFilteredCate] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  let dataChart;
  let dataSummary;

  const chartTitle = 'Percent Value vs Category';
  const totalValue = sum(data, d => d.value);
  const maxValue = max(data, d => d.value);
  const xValue = d => d.category;
  const yValue = d => (d.value / maxValue) * 100;


  const render = useCallback((data = []) => {
    if (chartWidth) {
      /*** Line chart ***/
      const innerWidth = chartWidth - margin.left - margin.right;
      const innerHeight = chartHeight - margin.top - margin.bottom;
      setInnerChartWidth(innerWidth);
      setInnerChartHeight(innerHeight);

      const xScale = scaleLinear()
        .domain([0, max(data, xValue)])
        .range([0, innerWidth]);

      const yScale = scaleLinear()
        .domain([max(data, yValue), 0])
        .range([0, innerHeight]);

      const xAxis = axisBottom(xScale);

      const yAxis = axisLeft(yScale)
        .tickFormat(n => `${n}%`)
        .tickSize(-innerWidth);

      select('body')
        .on('mousemove', () => {
          const xPos = event.offsetX;
          const yPos = event.offsetY;
          xCursorLine.attr('transform', `translate(0,${yPos - margin.top})`);
          yCursorLine.attr('transform', `translate(${xPos - margin.left},0)`);
        });
    
      const lineChart = dataChart.append('g')
        .attr('class', 'lineChart')
        .attr('id', 'lineChart')
        .attr('transform', `translate(${margin.left},${margin.top})`);

        lineChart.append('g')
          .append('text')
          .attr('id', 'chartTitle')
          .attr('text-anchor', 'middle')
          .attr('transform', `translate(${innerWidth / 2},${-margin.top / 2})`)
          .text(chartTitle);

        lineChart.append('g').call(yAxis)
          .attr('id', 'yAxis')
          .selectAll('.domain')
          .remove();

        lineChart.append('g').call(xAxis)
          .attr('id', 'xAxis')
          .attr('transform', `translate(0,${innerHeight})`)
          .selectAll('.domain, line')
          .remove();
      
        const cursorCrossline = lineChart.append('g')
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

        lineChart.append('path')
          .attr('d', drawLine(data))
          .attr('id', 'dataLine')
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('fill', 'none');

        lineChart.selectAll('circle')
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

        const tooltip = lineChart.append('g')
          .attr('class', 'tooltip')
          .attr('id', 'tooltip')
          .style('display', 'none');

          tooltip.append('rect')
            .attr('class', 'tooltipBox')
            .attr('width', tooltipWidth)
            .attr('height', 20 + tooltipPadding.top + tooltipPadding.bottom)
            .attr('transform', `translate(0,${-20 - tooltipPadding.top / 2})`)
            .style('fill', 'white')
            .style('stroke', 'black')
            .style('stroke-width', 2);

          tooltip.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('class', 'tooltipText')
            .attr('id', 'tooltipText')
            .style('font-size', '1em')
            .style('font-weight', 'bold');
        
      /*** Summary chart ***/
      const xSummaryValue = d => d.category;
      const ySummaryValue = d => (d.value / totalValue) * 100;

      const innerSummaryWidth = summaryWidth - margin.left - margin.right;
      const innerSummaryHeight = summaryHeight - margin.top - margin.bottom;

      const xSummaryScale = scaleLinear()
        .domain([0, max(data, xSummaryValue)])
        .range([0, innerSummaryWidth]);

      const ySummaryScale = scaleLinear()
        .domain([sum(data, ySummaryValue), 0])
        .range([0, innerSummaryHeight]);

      const highlightRange = 200;

      const summaryChart = dataSummary.append('g')
        .attr('class', 'summaryChart')
        .attr('id', 'summaryChart')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .on('mouseenter', () => {
          xCursorLine.style('display', 'none');
          yCursorLine.style('display', 'none');
        })
        .on('mouseout', () => {
          xCursorLine.style('display', null);
          yCursorLine.style('display', null);
        });

        const drawSummaryLine = line()
                      .x(d => xSummaryScale(xSummaryValue(d)))
                      .y(d => ySummaryScale(ySummaryValue(d)));

        summaryChart.append('path')
          .attr('d', drawSummaryLine(data))
          .attr('stroke', 'blue')
          .attr('stroke-width', 2)
          .attr('fill', 'none');

        summaryChart.append('rect')
          .attr('class', 'dragableBox')
          .attr('id', 'dragHandle')
          .attr('width', highlightRange)
          .attr('height', 20)
          .attr('fill', 'black')
          .attr('opacity', 0.2)

        const theDrag = drag();
        const dragHandle = select('#dragHandle');
        dragHandle.call(theDrag.on('start', () => {

        })
          .on('drag', () => {
            let pickupX = event.x - (dragHandle._groups[0][0].width.baseVal.value / 2);
            dragHandle.attr('x', pickupX);
          })
          .on('end', () => {
            const rangeStart = +dragHandle.attr('x');
            const rangeEnd = +dragHandle.attr('x')+highlightRange;
            const allCategories = [...Array((max(data, xValue))+1).keys()];
            const filteredCategory = allCategories.filter(i => xSummaryScale(allCategories[i]) >= rangeStart && xSummaryScale(allCategories[i]) <= rangeEnd);
            const categoryInRange = categories.filter(i => {
              const j = categories.indexOf(i);
              return xSummaryScale(categories[j]) >= rangeStart && xSummaryScale(categories[j]) <= rangeEnd;
            });
            const _data = data.filter(d => _.includes(categoryInRange, d.category));
            setCateInRange(categoryInRange);
            setFilteredCate(filteredCategory);
            setFilteredData(_data);
            
          }));

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
      tooltipPadding.left,
      dataSummary,
      summaryWidth,
      summaryHeight,
      categories]);


  const updateLineChart = (d) => {
    const lineChart = select('#lineChart');

    const xScale = scaleLinear()
        .domain([min(filteredCate), max(filteredCate)])
        .range([0, innerChartWidth]);

    const yScale = scaleLinear()
        .domain([max(d, yValue), 0])
        .range([0, innerChartHeight]);

    /*** Update the line ***/
    const drawLine = line()
                      .x(i => xScale(xValue(i)))
                      .y(i => yScale(yValue(i)));

    lineChart.select('#dataLine').remove().exit();
    lineChart.append('path')
      .attr('d', drawLine(filteredData))
      .attr('id', 'dataLine')
      .attr('stroke', 'blue')
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    /*** Update the dots ***/
    lineChart.selectAll('circle')
      .remove()
      .exit();
    lineChart.selectAll('circle')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('class', 'circlePoint')
      .attr('cy', i => yScale(yValue(i)))
      .attr('cx', i => xScale(xValue(i)))
      .attr('r', 6)
      .on('mouseover', () => {
        setTooltipWidth(document.getElementById('tooltipText').getBoundingClientRect().x);
        tooltip.style('display', null);
      })
      .on('mouseout', () => {
        tooltip.style('display', 'none');
      })
      .on('mousemove', i => {
        const xPos = event.offsetX;
        const yPos = event.offsetY;
        tooltip.attr('transform', `translate(${xPos - margin.left + 10},${yPos - margin.top - tooltipPadding.top - 16})`)
          .select('text')
          .text(`Name: ${i.user}`)
          .attr('transform', `translate(${tooltipPadding.left},0)`);
      });
      
      const tooltip = lineChart.select('#tooltip');
  };


  const updateTooltipWidth = useCallback(id => {
    if (!document.getElementById(id)) return;
      setTooltipWidth(document.getElementById(id).clientWidth);
      select('rect.tooltipBox')
        .attr('width', tooltipWidth + tooltipPadding.left + tooltipPadding.right)
        .attr('transform', `translate(0,${-20 - tooltipPadding.top / 2})`);
  }, [tooltipPadding.left, tooltipPadding.right, tooltipPadding.top, tooltipWidth]);


  const updateCategoryRange = useCallback(() => {
    console.log('Category in range:', cateInRange);
    console.log('Filtered Category:', filteredCate);

    const xScale = scaleLinear()
        .domain([min(filteredCate), max(filteredCate)])
        .range([0, innerChartWidth]);

    /*** Update the X axis ***/
    const xAxis = axisBottom(xScale);
    const lineChart = select('#lineChart');
    lineChart.select('#xAxis').remove();
    lineChart.append('g').call(xAxis)
          .attr('id', 'xAxis')
          .attr('transform', `translate(0,${innerChartHeight})`)
          .selectAll('.domain, line')
          .remove();

  }, [cateInRange, filteredCate]);


  /*** Initialisation ***/
  useEffect(() => {
    setDataState(data);
    return () => {};
  }, [])

  useEffect(() => {
    /*** Set initial state ***/
    console.log('Data state:', dataState);
    setMargin({ top: 40, right: 40, bottom: 40, left: 40 });
    dataChart = select('svg#dataChart');
    dataSummary = select('svg#dataSummary');
    setChartWidth(+dataChart.attr('width'));
    setChartHeight(+dataChart.attr('height'));
    setSummaryWidth(+dataSummary.attr('width'));
    setSummaryHeight(+dataSummary.attr('height'));
    setTooltipPadding({ top: 10, right: 20, bottom: 10, left: 20 });
    if (!_.isEmpty(data)) {
      // const filteredData = _.chain(data)
      //   .groupBy(d => d.category)
      //   .value();
      // console.log('Filtered Data:', filteredData);
      const _a = data.map(d => d.category);
      const _b = new Set(_a);
      setCategories([..._b].sort((i,j) => i - j));
      console.log('Categories:', categories);
    };
    /*** Initial render ***/
    render(dataState);
    return () => {};
  }, [dataState])

  useEffect(() => {
    updateTooltipWidth('tooltipText');
    return () => {};
  }, [tooltipWidth, updateTooltipWidth])

  useEffect(() => {
    updateCategoryRange();
    return () => {};
  }, [cateInRange, updateCategoryRange])

  useEffect(() => {
    updateLineChart(dataState);
    return () => {};
  }, [filteredData])


  return (
    <div>
      <svg id='dataChart' width='960' height='600'></svg>
      <svg id='dataSummary' width='960' height='100'></svg>
    </div>
  )
}
