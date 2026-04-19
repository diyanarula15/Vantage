#!/bin/zsh

echo "Stopping all node and python servers forcefully..."
lsof -ti:5173,5174,8000 | xargs kill -9 2>/dev/null || true
killall -9 node python3 Python 2>/dev/null || true
pkill -9 node 2>/dev/null || true
pkill -9 python 2>/dev/null || true

echo "Clearing Vite caches and Python pycache..."
cd /Users/apple/Desktop/vantage/Vantage
rm -rf frontend/node_modules/.vite
rm -rf frontend/dist
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

echo "Booting up Backend (Port 8000)..."
source venv/bin/activate || true
python3 -m uvicorn api:app --reload --port 8000 &

echo "Booting up Frontend (Port 5173)..."
cd frontend
npm run dev -- --force &

echo "Done! Servers are restarting fresh."
