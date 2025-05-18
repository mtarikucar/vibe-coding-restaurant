@echo off
echo Starting backend server...
cd /d %~dp0
npx nest start --watch
