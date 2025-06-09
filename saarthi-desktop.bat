@echo off 
echo Starting SAARTHI Desktop Application... 
 
REM Try Chrome first 
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" ( 
    "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="file:///C:\Users\HP\Downloads\person-details-page\desktop-app.html" --window-size=1400,900 
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" ( 
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app="file:///C:\Users\HP\Downloads\person-details-page\desktop-app.html" --window-size=1400,900 
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" ( 
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="file:///C:\Users\HP\Downloads\person-details-page\desktop-app.html" --window-size=1400,900 
) else ( 
    echo No supported browser found. Please install Chrome or Edge. 
    pause 
) 
