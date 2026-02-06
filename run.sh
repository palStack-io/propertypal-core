#!/bin/bash
# PropertyPal Core - Quick Start Script

set -e

echo "=========================================="
echo "  PropertyPal Core - Quick Start"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start
echo "Starting PropertyPal Core..."
docker-compose up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "=========================================="
    echo "  PropertyPal Core is running!"
    echo "=========================================="
    echo ""
    echo "  Open: http://localhost"
    echo ""
    echo "  First time? Create your account and property."
    echo ""
    echo "  Commands:"
    echo "    Stop:    docker-compose down"
    echo "    Logs:    docker-compose logs -f"
    echo "    Restart: docker-compose restart"
    echo ""
else
    echo "Error: Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi
