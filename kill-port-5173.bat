@echo off
echo Killing process on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo Done! Port 5173 is now free.
pause
