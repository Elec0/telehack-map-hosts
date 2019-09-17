import csv
import json

# Init default tree structure
connections = []


def handle_path_arr(paths):
    current_list = connections
    parsed_paths = []

    for path in paths:
        found_path = False
        parsed_paths.append(path)

        for elem in current_list:
            if elem["name"] == path:
                current_list = elem["children"]
                found_path = True
                break

        if not found_path:
            current_list.append({"name": path, "children": []})
            current_list = current_list[len(current_list) - 1]["children"]


def clean_empty(d):
    if not isinstance(d, (dict, list)):
        return d
    if isinstance(d, list):
        return [v for v in (clean_empty(v) for v in d) if v]
    return {k: v for k, v in ((k, clean_empty(v)) for k, v in d.items()) if v}


with open("connections-formatted.csv") as csvfile:
    reader = csv.reader(csvfile)

    for row in reader:
        cur_path = row[1]  # Skip the first element, we don't need it
        paths = cur_path.split("!")
        handle_path_arr(paths)

connections = clean_empty(connections)

# There should only be 1 entry, but there might be a second saying no path found
if len(connections) != 1:
    for c in connections:
        n = c["name"]
        if "no path to host" in n:
            continue  # This is fine, just ignore it
        elif "telehack" not in n:
            raise ValueError("An unexpected name has occurred ({})".format(n))

connections = connections[0]
print(connections)

with open("connections-formatted.json", "w") as f:
    f.write(json.dumps(connections, indent=4))

