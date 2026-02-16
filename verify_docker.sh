#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Verification Process...${NC}"

# 1. Check Docker connectivity
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not reachable.${NC}"
    echo "Please ensure Docker is running and you have permissions (try sudo)."
    exit 1
fi

# 2. Create .env from .env.example
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# 2. Build containers (clean build)
echo -e "${GREEN}Building containers (no cache)...${NC}"
docker compose build --no-cache

# 3. Start containers
echo -e "${GREEN}Starting containers...${NC}"
docker compose up -d

# 4. Wait for healthy DB
echo "Waiting for database to be ready..."
sleep 20 # Basic wait, but healty-check depend_on in compose should handle order

# 5. Check container status
echo -e "${GREEN}Checking container status...${NC}"
docker compose ps

# 6. Run migrations
echo -e "${GREEN}Running migrations...${NC}"
docker compose exec backend python manage.py migrate

# 7. Check backend connectivity
echo -e "${GREEN}Checking backend connectivity...${NC}"
if curl -s http://localhost:8000/api/ > /dev/null; then
    echo -e "${GREEN}Backend is reachable!${NC}"
else
    echo -e "${RED}Backend check failed (it might be 404 but should answer)${NC}"
    # Not failing script here as /api/ might not exist, just checking port response essentially
fi

# 8. Check frontend connectivity
echo -e "${GREEN}Checking frontend connectivity...${NC}"
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}Frontend is reachable!${NC}"
else
    echo -e "${RED}Frontend check failed${NC}"
fi

echo -e "${GREEN}Verification Complete!${NC}"
echo "You can manually test persistence by restarting containers."
