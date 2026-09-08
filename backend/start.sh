#!/bin/bash
# Runs both microservices in one container, exactly like the local
# `concurrently` dev setup, communicating over 127.0.0.1. If either process
# dies, this exits so Fly restarts the whole machine.
set -e

BIODATA_PORT="${BIODATA_SERVICE_PORT:-3001}"

node dist/apps/biodata-service/main.js &
BIODATA_PID=$!

# On a cold start (the machine scales to zero when idle), gateway would
# otherwise open its port and start accepting requests before biodata-service
# finishes connecting to MongoDB Atlas, causing early requests to fail with
# ECONNREFUSED. Block here until biodata-service's TCP port actually accepts
# connections, with a bounded wait so a genuinely broken biodata-service
# doesn't hang the container forever.
echo "Waiting for biodata-service on port $BIODATA_PORT..."
for i in $(seq 1 60); do
  if (echo > "/dev/tcp/127.0.0.1/$BIODATA_PORT") 2>/dev/null; then
    echo "biodata-service is up after ${i}s."
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "biodata-service did not come up after 60s, starting gateway anyway."
  fi
  sleep 1
done

node dist/apps/gateway/main.js &
GATEWAY_PID=$!

trap 'kill -TERM $BIODATA_PID $GATEWAY_PID 2>/dev/null' TERM INT

wait -n
EXIT_CODE=$?
kill -TERM $BIODATA_PID $GATEWAY_PID 2>/dev/null
exit $EXIT_CODE
