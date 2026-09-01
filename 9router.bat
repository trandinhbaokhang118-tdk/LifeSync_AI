@echo off
setlocal

REM Add Node.js to PATH if not already there
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

REM Run 9router via npx
npx -y 9router@latest %*

endlocal
