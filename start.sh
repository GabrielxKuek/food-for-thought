#!/bin/bash

# Food for Thought - Quick Start Script

echo "🍎 Food for Thought - Starting Development Servers"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📦 Checking dependencies...${NC}"
echo ""

# Frontend dependencies
if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd client
    npm install
    cd ..
else
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
fi

# Backend dependencies
echo -e "${YELLOW}⚠️  Backend dependencies: Run 'pip install -r server/requirements.txt'${NC}"
echo ""

echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""
echo "To start the servers:"
echo ""
echo -e "${GREEN}Terminal 1 - Backend:${NC}"
echo "  cd server"
echo "  python app.py"
echo "  → Runs on http://localhost:8080"
echo ""
echo -e "${GREEN}Terminal 2 - Frontend:${NC}"
echo "  cd client"
echo "  npm start"
echo "  → Opens http://localhost:3000"
echo ""
echo -e "${BLUE}🎉 Ready to go! Open two terminals and run the commands above.${NC}"
