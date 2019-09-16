#!/usr/bin/env bash
# Handle ctrl-c for killing process
trap "exit" INT TERM ERR
trap "kill 0" EXIT

python -m SimpleHTTPServer 8000 &

open http://localhost:8000

wait
