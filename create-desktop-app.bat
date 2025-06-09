@echo off
echo Creating SAARTHI Desktop Application...
echo.

echo Step 1: Saving the HTML file as an executable...
echo.

REM Create a simple batch file that opens the HTML in Chrome/Edge app mode
echo @echo off > saarthi-desktop.bat
echo echo Starting SAARTHI Desktop Application... >> saarthi-desktop.bat
echo. >> saarthi-desktop.bat
echo REM Try Chrome first >> saarthi-desktop.bat
echo if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" ( >> saarthi-desktop.bat
echo     "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///%cd%\desktop-app.html" --window-size=1400,900 >> saarthi-desktop.bat
echo ) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" ( >> saarthi-desktop.bat
echo     "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///%cd%\desktop-app.html" --window-size=1400,900 >> saarthi-desktop.bat
echo ) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ( >> saarthi-desktop.bat
echo     "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///%cd%\desktop-app.html" --window-size=1400,900 >> saarthi-desktop.bat
echo ) else ( >> saarthi-desktop.bat
echo     echo No supported browser found. Please install Chrome or Edge. >> saarthi-desktop.bat
echo     pause >> saarthi-desktop.bat
echo ) >> saarthi-desktop.bat

echo.
echo Desktop application created successfully!
echo.
echo To run SAARTHI:
echo 1. Double-click 'saarthi-desktop.bat'
echo 2. Or right-click 'desktop-app.html' and open with Chrome/Edge
echo.
echo The application will run in app mode (looks like a desktop app)
echo All your data is saved locally and works offline!
echo.
pause
