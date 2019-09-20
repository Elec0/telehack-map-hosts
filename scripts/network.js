var svg = d3.select("svg")
//var width = +svg.attr("width")
//var height = +svg.attr("height")
var width = 1000
var height = 1000
var scale = [0.25, 0.25]
var translate = [0, 0]
var scaleDelta = 0.001;
var scaleMin = 0.1;

// Colors
var coloredLinks = []
var linkColorHover = "red"
var linkColorDefault = "#999"
var nodeColorDefault = "black"
var nodeColorHover = "red";
var nodeConnectionColorHover = "lightblue";
var bbsColorFill = "orange"; //"#1A5000";
var milColorFill = "tan"

// Files to load
stableNodes = false
graph = false
uumap = false

svg.attr("viewBox", [-width / 2, -height / 2, width, height])
    .on("wheel.zoom", zoom)
    .call(d3.drag().on("start", started))
    .append("g")
    .attr("transform", "scale(" + scale[0] + "," + scale[1] + ")")
    .attr("id", "mainG")

svg = d3.select("#mainG")
updateTransform();

function zoom() {
    d3.event.preventDefault();
    var dY = d3.event.wheelDeltaY
    newScale = scale[0] + (scaleDelta * dY)

    if(newScale < scaleMin)
        newScale = scaleMin;
    scale = [newScale, newScale]
    updateTransform();
}

function started() {
    d3.event.on("drag", dragged)
    function dragged(d) {
        translate = [translate[0] + d3.event.dx, translate[1] + d3.event.dy]
        updateTransform();
    }
}

function updateTransform() {
    svg.attr("transform", "translate(" + translate[0] + "," + translate[1] + ") scale(" + scale[0] + "," + scale[1] + ")");
}

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-20).theta(0.9))
    .force("center", d3.forceCenter(0, height / 2))
    .stop()

d3.json("python/network-telehack.json").then(function(d) {
    graph = d
    dataLoaded();
});
d3.json("stable-nodes.json").then(function(d)  {
    stableNodes = d;
    dataLoaded();
});
d3.json("uumap.json").then(function(d) {
    uumap = d;
    dataLoaded();
});

function dataLoaded() {
    // We've not loaded both yet
    if(!stableNodes || !graph || !uumap)
        return
    console.log("Data loaded")

    var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("id", d => formatID(d["source"]) + "-" + formatID(d["target"]))
        .attr("class", "link");

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("id", d => formatID(d.id))
        .style("fill", d => colorNode(d, "fill"))
        .style("stroke", d => colorNode(d, "stroke"))
        .on("mouseover", nodeMouseOver)
        .on("mouseout", nodeMouseOut)
    node.append("title").text(d => d.id)


        simulation.nodes(graph.nodes)
            .on("tick", ticked)
        simulation.force("link").links(graph.links);

        loadNodePositions();
        simulation.restart();

        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            // Stop the simulation after one tick, otherwise nothing will render
            simulation.stop()
        }
}

function loadNodePositions() {
    graph.nodes.forEach(function(cur_node) {
        // Find the current node in the stable nodes list
        stableNodes.forEach(function(stable) {
            if(stable["id"] === cur_node["id"]) {
                cur_node["x"] = stable["x"]
                cur_node["y"] = stable["y"]
                return
            }
        });
    });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function nodeMouseOver(d) {
    cur_connections = uumap[d.id].c
    d_id = formatID(d.id)

    console.log(uumap[d.id].os);

    // Set the node hover style
    d3.select(this).style("stroke", "red");

    // Since the links might be from this node to connections, or from connections to this node and *not* duplicated
    // that means we need to search for the combinations of each
    cur_connections.forEach(function(d) {
        cur_target = formatID(d);

        // Set the connected node's hover style
        d3.select("#" + cur_target).style("stroke", nodeConnectionColorHover);

        linkTest = [d_id + "-" + cur_target, cur_target + "-" + d_id];

        linkTest.forEach(d => {
            sel = d3.select("#" + d);
            if(!sel.empty()) {
                coloredLinks.push(["#" + d, "#" + cur_target]);
                sel.style("stroke", linkColorHover);
            }
        });
    });
}

function nodeMouseOut(d) {
    d3.select(this).style("stroke", nodeColorDefault);

    coloredLinks.forEach(function(d) {
        // coloredLinks is an array of arrays  with [linkid, nodeid]
        d3.select(d[0]).style("stroke", linkColorDefault);
        d3.select(d[1]).style("stroke", nodeColorDefault);
    });
    coloredLinks = []
}

function colorNode(d, type) {
    switch(uumap[d.id].os) {
        case "BBS":
            return bbsColorFill;
        case "MIL":
            if(type === "stroke")
                return nodeColorDefault;
            return milColorFill;
        default:
            return nodeColorDefault;
    }
}

function savepositions() {
    simulation.stop()
    cancelvel();

    var blob = new Blob([JSON.stringify(simulation.nodes())], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "sequence_dl.json");
}
function stop() {
    console.log("stopped")
    simulation.stop()
}
function start() {
    console.log("started")
    simulation.restart()
}
function cancelvel() {
    simulation.nodes().forEach(function(d) {
        d.vx = 0
        d.vy = 0
    });
    console.log("canceled")
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatID(str) {
    return str.replace(/^\d+/g, "").replace(/\./g, "")
}