var width = 1000;
var height = 700;
var vbWidth = -width / 2;
var vbHeight = -height / 2;
var scale = [0.7, 0.7]
translate = [0, 0]
var scaleDelta = 0.001;
var scaleMin = 0.1;

var color = d3.scaleOrdinal(d3.schemeCategory10);
var radius = 3.5;

var svg = d3.select("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .on("wheel.zoom", zoom)
      .call(d3.drag().on("start", started))
      .append("g")
      .attr("transform", "translate(" + translate[0] + "," + translate[1] + ") scale(" + scale[0] + "," + scale[1] + ")")
      .attr("id", "maing");

function zoom() {
    d3.event.preventDefault();
    var dY = d3.event.wheelDeltaY
    newScale = scale[0] + (scaleDelta * dY)

    if(newScale < scaleMin)
        newScale = scaleMin;
    scale = [newScale, newScale]
    svg.attr("transform", "translate(" + translate[0] + "," + translate[1] + ") scale(" + scale[0] + "," + scale[1] + ")");
}

function started() {
    d3.event.on("drag", dragged)
    function dragged(d) {
        translate = [translate[0] + d3.event.dx, translate[1] + d3.event.dy]

        svg.attr("transform", "translate(" + translate[0] + "," + translate[1] + ") scale(" + scale[0] + "," + scale[1] + ")");
    }
}

d3.json("connections-formatted.json").then(function(data) {
    var root = d3.hierarchy(data);
    var nodes = root.descendants();
    var links = root.links();

    var simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(0).strength(1))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    var link = svg.selectAll(".link")
        .data(links)
      .enter().append("line")
        .attr("class", "link");

    var node = svg.selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node");


    node.append("circle")
        .attr("fill", d => d.children ? "#fff" : "#000")
        .attr("stroke", d => d.children ? "#000" : "#fff")
        .attr("r", radius)
        .on("mouseover", circleMouseOver)
        .on("mouseout", circleMouseOut);


    node.append("text")
        .attr("x", 10)
        .attr("dy", ".30em")
        .attr("visibility", "hidden")
        .text(function(d) {return d.data.name; });

    simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    //constrains the nodes to be within a box
    //node
    //    .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(Math.abs(width - vbWidth) - radius, d.x)); })
    //    .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(Math.abs(height - vbHeight) - radius, d.y)); });

    node
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    //    .attr("transform", function(d) { return "translate(" + Math.max(radius, Math.min(vbWidth, d.x)) + ","
    //    + Math.max(radius, Math.min(height - radius, d.y)) + ")"; });
    });
});

function circleMouseOver(d, i) {
    d3.select("#ttNode").html(d.data.name);

}
function circleMouseOut(d, i) {

}
