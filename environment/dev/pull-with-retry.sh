#!/bin/bash

# Script to pull Docker images with retry logic
# Usage: ./pull-with-retry.sh [max-retries] [delay-seconds]

MAX_RETRIES=${1:-5}
DELAY=${2:-10}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Attempting to pull Docker images with up to $MAX_RETRIES retries..."
echo "Delay between retries: ${DELAY}s"
echo ""

for i in $(seq 1 $MAX_RETRIES); do
    echo "=========================================="
    echo "Attempt $i of $MAX_RETRIES"
    echo "=========================================="
    
    cd "$DIR"
    if docker compose pull; then
        echo ""
        echo "✅ Successfully pulled all images!"
        exit 0
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo ""
            echo "❌ Pull failed. Waiting ${DELAY}s before retry..."
            sleep $DELAY
        else
            echo ""
            echo "❌ All retry attempts failed."
            exit 1
        fi
    fi
done






