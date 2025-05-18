@echo off
echo Starting development environment...

REM Start the database services
echo Starting database services...
docker-compose up -d postgres redis

REM Wait for the database to be ready
echo Waiting for database to be ready...
timeout /t 5 /nobreak > nul

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  cd backend && npm install && cd ..
)

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend && npm install && cd ..
)

REM Start the backend and frontend
echo Starting backend...
start cmd /k "cd backend && npm run start:dev"

echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

echo Development environment started. Close this window to stop.
echo Press any key to stop all services...
pause > nul

REM Stop services
echo Stopping services...
docker-compose stop postgres redis
echo Development environment stopped.
