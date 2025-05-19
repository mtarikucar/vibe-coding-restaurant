@echo off
echo Running all tests for the Restaurant Management System
echo =====================================================

echo.
echo Running Backend Tests...
echo ---------------------
cd backend
npm test

echo.
echo Running Frontend Tests...
echo ---------------------
cd ../frontend
npm test

echo.
echo All tests completed!
