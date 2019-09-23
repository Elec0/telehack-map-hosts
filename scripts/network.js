var svg = null
var width = null
var height = null
var scale = null
var translate = null
var scaleDelta = null
var scaleMin = null
var isDragging = null
var lastSearch = null

// Colors
var coloredLinks = null
var linkColorHover = null
var linkColorDefault = null
var nodeColorDefault = null
var nodeColorHover = null
var nodeConnectionColorHover = null
var bbsColorFill = null
var milColorFill = null

// Files to load
var stableNodes = null
var graph = null
var uumap = null

function init() {
    svg = d3.select("svg")
    width = d3.select("#svg-container").node().getBoundingClientRect().width
    height = window.innerHeight * 0.8;
    scale = [0.25, 0.25]
    translate = [0, 0]
    scaleDelta = 0.001;
    scaleMin = 0.1;
    isDragging = false;
    lastSearch = null;

    // Colors
    coloredLinks = []
    linkColorHover = "red"
    linkColorDefault = "#999"
    nodeColorDefault = "black"
    nodeColorHover = "red";
    nodeConnectionColorHover = "lightblue";
    bbsColorFill = "orange";
    milColorFill = "tan"

    // Files to load
    stableNodes = false
    graph = false
    uumap = false

    svg.attr("viewBox", [-width / 2, -height / 2, width, height])
        .on("wheel.zoom", zoom)
        .attr("width", width)
        .attr("height", height)
        .call(d3.drag().on("start", started))
        .append("g")
        .attr("transform", "scale(" + scale[0] + "," + scale[1] + ")")
        .attr("id", "mainG")

    raw_svg = svg;
    svg = d3.select("#mainG");
    updateTransform();
}

window.addEventListener("resize", init);
init();

d3.select("#btnSearch").on("click", search);
d3.select("#saveSvg")
    .on("click", writeDownloadLink);

function zoom() {
    d3.event.preventDefault();
    var dY = -d3.event.deltaY

    newScale = scale[0] + (scaleDelta * dY)

    if(newScale < scaleMin)
        newScale = scaleMin;
    scale = [newScale, newScale]
    updateTransform();
}

function started() {
    d3.event.on("drag", dragged)
    function dragged(d) {
        translate = [translate[0] + d3.event.dx, translate[1] + d3.event.dy];
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
    d3.select("#loading").remove();

    var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("id", d => formatID(d["source"]) + "-" + formatID(d["target"]))
        .attr("class", "link")
        .style("stroke-width", "1px")
        .style("stroke", "#999")
        .style("stroke-opacity", "1");

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("id", d => formatID(d.id))
        .attr("raw_name", d => d.id)
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

function nodeMouseOver(d) {
    if(isDragging === true)
        return;

    cur_connections = uumap[d.id].c
    d_id = formatID(d.id)

    d3.select("#ttHost").html(d.id);
    d3.select("#ttOS").html(uumap[d.id].os);

    // Set the node hover style
    d3.select("#" + d.id).style("stroke", "red");

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
    d3.select("#" + d.id).style("stroke", nodeColorDefault);

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

function writeDownloadLink() {
    try {
        var isFileSaverSupported = !!new Blob();
    } catch (e) {
        alert("blob not supported");
    }

    var html = d3.select("svg")
        .attr("title", "test2")
        .attr("version", 1.1)
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .node().parentNode.innerHTML;

    var blob = new Blob([html], {type: "image/svg+xml"});
    saveAs(blob, "telehack-map.svg");
}

function search() {
    // Un-highlight stuff
    if(lastSearch)
        nodeMouseOut(lastSearch.node().__data__);
    d3.select("#notFound").html("");

    input = d3.select("#search").property("value");
    result = d3.select("circle[raw_name='" + input + "']");

    if(result.empty()) {
        d3.select("#notFound").html("Host not found");
        lastSearch = null;
        return;
    }
    lastSearch = result;
    x = result.property("cx").baseVal.value;
    y = result.property("cy").baseVal.value;


    translate = [-x, -y];
    scale = [1,1];

    nodeMouseOver(result.node().__data__);

    svg.transition()
        .duration(2000)
        .attr("transform", "translate(" + (-x) + "," + (-y) + ") scale(" + scale[0] + "," + scale[1] + ")");


}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatID(str) {
    return str.replace(/^\d+/g, "").replace(/\./g, "")
}
