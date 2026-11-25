#!/bin/bash
# propertyPal Core - Quick Start Script

set -e

echo "=========================================="
echo "  propertyPal Core - Quick Start"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# First run: create .env with generated secrets
if [ ! -f .env ]; then
    cp .env.example .env
    for key in SECRET_KEY JWT_SECRET_KEY POSTGRES_PASSWORD; do
        sed -i.bak "s|^$key=.*|$key=$(openssl rand -hex 32)|" .env
    done
    rm -f .env.bak
    echo "Created .env with generated secrets."
fi

# Build and start
echo "Starting propertyPal Core..."
docker compose up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "=========================================="
    echo "  propertyPal Core is running!"
    echo "=========================================="
    echo ""
    echo "  Open: http://localhost"
    echo ""
    echo "  First time? Create your account and property."
    echo ""
    echo "  Commands:"
    echo "    Stop:    docker compose down"
    echo "    Logs:    docker compose logs -f"
    echo "    Restart: docker compose restart"
    echo ""
else
    echo "Error: Services failed to start. Check logs with: docker compose logs"
    exit 1
fi
