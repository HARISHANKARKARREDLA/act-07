function scatter_plot(data, ax, title = "", xCol = "", yCol = "", rCol = "", legend = [], colorCol = "", margin = 50) {
    const X = data.map(d => d[xCol]);
    const Y = data.map(d => d[yCol]);
    const R = data.map(d => d[rCol]);

    // Get unique categories for coloring
    const colorCategories = [...new Set(data.map(d => d[colorCol]))];
    const color = d3.scaleOrdinal()
        .domain(colorCategories)
        .range(d3.schemeTableau10);

    // Calculate axis extents
    const xExtent = d3.extent(X, d => +d);
    const yExtent = d3.extent(Y, d => +d);
    
    const xMargin = (xExtent[1] - xExtent[0]) * 0.05; // 5% margin
    const yMargin = (yExtent[1] - yExtent[0]) * 0.05; // 5% margin

    // Scales for axes and radius
    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xMargin, xExtent[1] + xMargin])
        .range([margin, 1000 - margin]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yMargin, yExtent[1] + yMargin])
        .range([1000 - margin, margin]);

    const rScale = d3.scaleSqrt().domain(d3.extent(R, d => +d)).range([4, 12]);

    // Select the figure container
    const Fig = d3.select(`${ax}`);

    // Append circles to the scatter plot
    Fig.selectAll('.markers')
        .data(data)
        .join('g')
        .attr('transform', d => `translate(${xScale(d[xCol])}, ${yScale(d[yCol])})`)
        .append('circle')
        .attr("class", d => `circle ${d[colorCol]}`)
        .attr("data-model", d => d.Model)
        .attr("r", d => rScale(d[rCol]))
        .attr("fill", d => color(d[colorCol]))
        .style("fill-opacity", 1);

    // Create X and Y Axes
    const x_axis = d3.axisBottom(xScale).ticks(4);
    const y_axis = d3.axisLeft(yScale).ticks(4);

    // X Axis
    Fig.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${1000 - margin})`)
        .call(x_axis);

    // Y Axis
    Fig.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin}, 0)`)
        .call(y_axis);

    // X and Y Labels
    Fig.append("g")
        .attr("class", "label")
        .attr("transform", `translate(${500}, ${1000 - 10})`)
        .append("text")
        .attr("class", "label")
        .text(ax === "#figure2" ? "EngineSizeCI" : xCol)
        .attr("fill", "black");

    Fig.append("g")
        .attr("transform", `translate(${35}, 500) rotate(270)`)
        .append("text")
        .attr("class", "label")
        .text(yCol)
        .attr("fill", "black");

    // Title
    Fig.append('text')
        .attr('x', 500)
        .attr('y', 80)
        .attr("text-anchor", "middle")
        .text(title)
        .attr("class", "title")
        .attr("fill", "black");

    // Brush functionality
    const brush = d3.brush()
        .on("start", brushStart)
        .on("brush end", brushed)
        .extent([[margin, margin], [1000 - margin, 1000 - margin]]);

    Fig.call(brush);

    // Brush start function
    function brushStart() {
        if (d3.brushSelection(this)[0][0] === d3.brushSelection(this)[1][0]) {
            d3.selectAll("circle").classed("selected", false); // Deselect all circles
        }
    }

    // Brush end function
    function brushed() {
        const selected_coordinates = d3.brushSelection(this);
        if (!selected_coordinates) return; // Exit if no selection exists

        const X1 = xScale.invert(selected_coordinates[0][0]);
        const X2 = xScale.invert(selected_coordinates[1][0]);
        const Y1 = yScale.invert(selected_coordinates[0][1]);
        const Y2 = yScale.invert(selected_coordinates[1][1]);

        // Select circles within the brush area
        d3.selectAll("circle").classed("selected", (d, i) => {
            return (+d[xCol] >= X1 && +d[xCol] <= X2 && +d[yCol] <= Y1 && +d[yCol] >= Y2);
        });
    }

    // Create legend container
    const legendContainer = Fig.append("g")
        .attr("transform", `translate(${800}, ${margin})`)
        .attr("class", "marginContainer");

    // Use default legend if none provided
    if (legend.length === 0) { legend = colorCategories; }

    // Create legend items
    const legendItems = legendContainer.selectAll("legends")
        .data(legend)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 45})`);

    // Add colored rectangles for legend
    legendItems.append("rect")
        .attr("fill", d => color(d))
        .attr("width", 40)
        .attr("height", 40)
        .attr("class", "legend-box")
        .attr("data-category", d => d);

    // Legend click event for toggling opacity
    legendItems.on("click", (event, d) => {
        const isTranslucent = d3.select(event.currentTarget).select("rect").classed("inactive");
        d3.select(event.currentTarget).select("rect")
            .classed("inactive", !isTranslucent)
            .style("fill-opacity", isTranslucent ? 1 : 0.3);

        const relatedCircles = d3.selectAll(`.circle.${d.replace(/\s+/g, '_')}`);
        if (relatedCircles.empty()) return;
        relatedCircles.style("fill-opacity", isTranslucent ? 1 : 0.1);

        d3.selectAll(".legend-box")
            .filter(function () {
                return d3.select(this).attr("data-category") === d;
            })
            .classed("inactive", !isTranslucent)
            .style("fill-opacity", isTranslucent ? 1 : 0.3);
    });

    // Add text labels for legend
    legendItems.append("text")
        .text(d => d)
        .attr("x", 50)
        .attr("y", 25)
        .attr("alignment-baseline", "middle")
        .attr("class", "legend-text")
        .style("font-size", "24px")
        .style("fill", "black");
}
