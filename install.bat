@echo off
echo Installing SAARTHI Desktop Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
npm install

echo.
echo Building application...
npm run build-win

echo.
echo Installation complete!
echo You can find the installer in the 'dist' folder.
echo.
pause
