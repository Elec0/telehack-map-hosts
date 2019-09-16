var width = 1500;
var height = 900;
var color = d3.scaleOrdinal(d3.schemeCategory10);

var svg = d3.select("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .append("g").attr("transform", "translate(50," + (height / 2 + 90)*0 + ") scale(0.7, 0.7)");

d3.json("connections-formatted.json").then(function(data) {
    var root = d3.hierarchy(data);
    var nodes = root.descendants();
    var links = root.links();

    var simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(0).strength(1))
        .force("charge", d3.forceManyBody().strength(-20))
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
        .attr("r", 3.5)
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

    node
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });

    //invalidation.then(() => simulation.stop());
});

function circleMouseOver(d, i) {
    d3.select("#ttNode").html(d.data.name);
    console.log(d);

}
function circleMouseOut(d, i) {

}
