@echo off
rem Opens frontend-gym.html (same folder) in its own window, without tabs and address bar.
rem Uses Chrome if it is installed, otherwise Microsoft Edge. No internet and no website needed.
setlocal
set "FILE=%~dp0frontend-gym.html"
if not exist "%FILE%" (
  echo frontend-gym.html was not found next to this file.
  pause
  exit /b 1
)
set "URL=file:///%FILE:\=/%"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run
set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run
set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%CHROME%" goto run
start "" msedge --app="%URL%"
exit /b 0
:run
start "" "%CHROME%" --app="%URL%"
