#!/usr/bin/env bash
# Handle ctrl-c for killing process
trap "exit" INT TERM ERR
trap "kill 0" EXIT

if [ ! -z "$1" ]
then
  if [ "$1" == "get-hosts" ]
  then
    echo "Get hosts"
    python python/get_hosts.py
    echo "Get Connections"
    python python/get_connections.py
    echo "Parse for D3"
    python python/parse_for_d3.py
    echo "Copy connections file"
    rm connections-formatted.json
    cp python/connections-formatted.json ./
  else
    echo "Use get-hosts to retrieve hosts list from your connection."
    exit
  fi
fi

python -m SimpleHTTPServer 8080 &

open http://localhost:8080

wait
