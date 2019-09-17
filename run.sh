#!/usr/bin/env bash
# Handle ctrl-c for killing process
trap "exit" INT TERM ERR
trap "kill 0" EXIT

python -m SimpleHTTPServer 8080 &

open http://localhost:8080

wait
