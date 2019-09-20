import json
import networkx as nx

with open('uumap.json') as reader:
    hosts = json.load(reader)

# Start at telehack, loop through connections, adding children as we go
# once those are parsed, start doing the same thing in a dfs manner for the connected hosts
# that should get all the connected stuff
# EXCEPT, I bet that some of the hosts aren't connected to telehack, like MIL
# It would be better, then, to create a graph of everything, I guess
# Let's try that

# Note: BBS have no connections, so they can be ignored


# Graph
G = nx.Graph()
json_object = {"nodes": [], "links": []}

for host, val in hosts.items():
    if val["os"] != "BBS":
        G.add_node(host)
    if val["c"]:
        for con in val["c"]:
            if not con:
                continue
            edge = (host, con)
            G.add_edge(*edge)

# Now that the graph is built, just traverse it?
# Create host json info
# Create a unique file for each connected group of nodes
links = {}
for c in nx.connected_components(G):
    if len(c) <= 1:
        continue

    for cur_node in c:
        json_object["nodes"].append({"id": cur_node})

        # Each link is bidirectional, so we only need to ensure that a node from a->b exists
        if cur_node not in links or not isinstance(links[cur_node], list):
            links[cur_node] = []

        for cur_link in G[cur_node]:
            # See if the other node has a link to this node
            if cur_link in links:
                if cur_node in links[cur_link]:
                    # If it does, skip this link
                    continue
            # If it doesn't, add the link to the json and to the dict
            json_object["links"].append({"source": cur_node, "target": cur_link})
            links[cur_node].append(cur_link)

    with open("network-{}-({}).json".format(len(c), next(iter(c))), "w") as f:
        json.dump(json_object, f)
    json_object = {"nodes": [], "links": []}

"""
for node in G.nodes():
    json_object["nodes"].append({"id": node})

for edge in G.edges():
    json_object["links"].append({"source": edge[0], "target": edge[1]})

with open("network-graph.json", "w") as f:
    json.dump(json_object, f)
"""
