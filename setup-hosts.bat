@echo off
echo Setting up hosts file entry for southsidewhapp...
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click the script and select "Run as administrator"
    pause
    exit /b 1
)

REM Backup the hosts file
copy %windir%\System32\drivers\etc\hosts %windir%\System32\drivers\etc\hosts.backup >nul
echo Hosts file backed up to hosts.backup

REM Check if entry already exists
findstr /c:"127.0.0.1 southsidewhapp" %windir%\System32\drivers\etc\hosts >nul
if %errorLevel% equ 0 (
    echo Entry for southsidewhapp already exists in hosts file
) else (
    REM Add the entry
    echo 127.0.0.1 southsidewhapp >> %windir%\System32\drivers\etc\hosts
    echo Added southsidewhapp entry to hosts file
)

echo.
echo Hosts file updated successfully!
echo You can now access your app at: http://southsidewhapp:3000
echo.
pause
