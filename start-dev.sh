#! /usr/bin/bash

# Start the database services
echo "Starting database services..."
docker-compose up -d postgres redis

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start the backend and frontend in separate terminals
echo "Starting backend..."
cd backend && npm run start:dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
function cleanup {
  echo "Stopping services..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  docker-compose stop postgres redis
  echo "Development environment stopped."
  exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep the script running
echo "Development environment started. Press Ctrl+C to stop."
wait
