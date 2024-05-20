let rawData, cleanedData
const HEART_ATTACK = "Heart Attack"
const AGE = "Age"
const EMPTY_STRING = ""
const SMOKER = "Smoker"
const EXERCISE_HOURS_WEEK = "Exercise hours/week"
const CHOLESTEROL = "Cholesterol mg/dL"
const WEIGHT = "Weight kg"
let scatterplotDatapoints
const transitionDuration = 1500;

window.addEventListener('scroll', function () {
    const scroll = window.scrollY;
    document.querySelectorAll('.parallax-layer').forEach(layer => {
        const speed = layer.getAttribute('data-speed');
        const yPos = -(scroll * speed / 100);
        layer.style.transform = `translateY(${yPos}px)`;
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    rawData = await getLoadedDataset()
    console.log(rawData[0])
    cleanedData = getCleanedRawData(rawData)
    console.log(cleanedData[0])
    drawScatterPlot(WEIGHT, EXERCISE_HOURS_WEEK, HEART_ATTACK, "yes_plot_svg_overview", 500, 450, 9)
    drawScatterPlot(WEIGHT, CHOLESTEROL, HEART_ATTACK, "no_plot_svg_overview", 500, 450, 9)
    drawScatterPlot(WEIGHT, EXERCISE_HOURS_WEEK, HEART_ATTACK, "yes_plot_svg", 1000, 700, 20)
    drawScatterPlot(WEIGHT, CHOLESTEROL, HEART_ATTACK, "no_plot_svg", 1000, 700, 20)
    setCaption(WEIGHT, EXERCISE_HOURS_WEEK, "left_plot_caption")
    setCaption(WEIGHT, CHOLESTEROL, "right_plot_caption")

});

const setCaption = (xAttr, yAttr, id) => {
    document.getElementById(id).innerHTML = "<b>" + xAttr + "</b>" + " vs " + "<b>" + yAttr + "</b>";
}


const getLoadedDataset = async () => {
    const currentDatasetPath = "data/Heart_health new.csv";
    return new Promise((resolve, reject) => {
        d3.csv(currentDatasetPath)
            .then(data => resolve(data))
            .catch(error => reject(error))
    })
}


const getCleanedRawData = (csvData) => {
    return csvData.filter(row => {
        const heartAttack = row[HEART_ATTACK];
        const age = row[AGE];
        const smoker = row[SMOKER];
        const exerciseHoursWeek = row[EXERCISE_HOURS_WEEK];
        const cholesterol = row[CHOLESTEROL];

        return heartAttack !== EMPTY_STRING && !isNaN(heartAttack)
            && age !== EMPTY_STRING && !isNaN(age)
            && smoker !== EMPTY_STRING
            && exerciseHoursWeek !== EMPTY_STRING && !isNaN(exerciseHoursWeek)
            && cholesterol !== EMPTY_STRING && !isNaN(cholesterol);
    });
}


const drawScatterPlot = (xAttribute, yAttribute, heartAttack, svgId, w, h, z) => {
    let margin = {top: 100, right: 50, bottom: 50, left: 70};
    let width = w - margin.left - margin.right;
    let height = h - margin.top - margin.bottom;

    // Create SVG element
    let scatterPlotSvg = d3.select("#" + svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let colorScale = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["#AFE1AF", "#ff5733"]);
    const frequencyMap = {};

    rawData.forEach(obj => {
        const key = `${obj[xAttribute]}-${obj[yAttribute]}`;
        if (frequencyMap[key]) {
            frequencyMap[key]++;
        } else {
            frequencyMap[key] = 1;
        }
    });
    let data = rawData.map(item => {
        return {
            x: parseFloat(item[xAttribute]),
            y: parseFloat(item[yAttribute]),
            colorAttribute: parseInt(item[heartAttack]),
            freq: frequencyMap[`${item[xAttribute]}-${item[yAttribute]}`]
        }
    })

    xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.x)])
        .range([0, width]);

    yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
        .range([height, 0]);

    const zScale = d3.scaleSqrt()
        .domain([1, 38])
        .range([1, z])

    scatterPlotSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 15)
        .attr('text-anchor', 'middle')
        .attr("class", "scatterPlotXLabel")
        .style("font-size", "12px")
        .text(xAttribute);

    scatterPlotSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(width / 3) + 20)
        .attr('y', margin.left / 2 - 70)
        .attr('text-anchor', 'middle')
        .attr("class", "scatterPlotYLabel")
        .style("font-size", "12px")
        .text(yAttribute);


    // Create axis
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisLeft(yScale);
    let xAxisGroup = scatterPlotSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    let yAxisGroup = scatterPlotSvg.append("g")
        .call(yAxis);

    // data = cleanedData.map(item => {
    //     return {
    //         x: Number(item[xAttribute]),
    //         y: Number(item[yAttribute]),
    //         colorAttribute: item[heartAttack],
    //     }
    // })

    xScale.domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
    yScale.domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])


    scatterplotDatapoints = scatterPlotSvg.selectAll(".scatterplotDatapoints")
        .data(data)


    scatterplotDatapoints
        .join(
            enter => enter.append("circle")
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", d => zScale(d.freq))
                .style("fill", d => colorScale(d.colorAttribute))
                .attr("stroke", d => colorScale(d.colorAttribute))
                .style('stroke-width', '1.5')
                .attr("class", "scatterplotDatapoints"),
            update => update.transition()
                .duration(transitionDuration)
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .style("fill", d => colorScale(d.colorAttribute))
            ,
            exit => exit.remove()
        )

    // Added Legend
    const legend = scatterPlotSvg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width - 200) + "," + -80 + ")");

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#AFE1AF"); // Male color

    legend.append("text")
        .attr("x", 25)
        .attr("y", 12)
        .style("font-size", "15px")
        .text("Alive");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 25)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#ff5733"); // Female color

    legend.append("text")
        .attr("x", 25)
        .attr("y", 38)
        .style("font-size", "15px")
        .text("Died from Heart Attack");

}

const drawScatterPlotWithLines = () => {

}

const drawAreaChart = (xAttribute, yAttribute, heartAttack, svgId) => {
    let margin = {top: 100, right: 50, bottom: 50, left: 70};
    let width = 1200 - margin.left - margin.right;
    let height = 700 - margin.top - margin.bottom;

    let scatterPlotSvg = d3.select("#" + svgId)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let colorScale = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["#AFE1AF", "#ff5733"]);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function (d) {
            return xScale(d[xAttribute]);
        })
        .y0(yScale(0))
        .y1(function (d) {
            return yScale(d[yAttribute]);
        });


    var sources = cleanedData.columns.map(function (row) {
        return {
            heartAttack: row[HEART_ATTACK],
            values: data.map(function (row) {
                return {CHOLESTEROL: row[CHOLESTEROL],};
            })
        };
    });

    console.log(sources);

    x.domain(d3.extent(data, function (d) {
        return d.date;
    }));
    y.domain([
        0,
        d3.max(sources, function (c) {
            return d3.max(c.values, function (d) {
                return d.kW;
            });
        })
    ]);
    z.domain(sources.map(function (c) {
        return c.id;
    }));

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "#000")
        .text("Power, kW");

    var source = g.selectAll(".area")
        .data(sources)
        .enter().append("g")
        .attr("class", function (d) {
            return `area ${d.id}`;
        })

    source.append("path")
        .attr("d", function (d) {
            console.log(area(d.values));
            return area(d.values);
        })
        .style("fill", function (d) {
            return z(d.id);
        });
}
