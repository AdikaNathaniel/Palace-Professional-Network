#!/bin/bash
# Runs both microservices in one container, exactly like the local
# `concurrently` dev setup, communicating over 127.0.0.1. If either process
# dies, this exits so Fly restarts the whole machine.
set -e

node dist/apps/biodata-service/main.js &
BIODATA_PID=$!

node dist/apps/gateway/main.js &
GATEWAY_PID=$!

trap 'kill -TERM $BIODATA_PID $GATEWAY_PID 2>/dev/null' TERM INT

wait -n
EXIT_CODE=$?
kill -TERM $BIODATA_PID $GATEWAY_PID 2>/dev/null
exit $EXIT_CODE
