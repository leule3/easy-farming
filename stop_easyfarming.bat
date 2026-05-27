@echo off
title Stopping Easy Farming
echo Stopping Easy Farming servers...
taskkill /FI "WindowTitle eq EasyFarming-Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq EasyFarming-Frontend*" /T /F >nul 2>&1
echo Done! All servers stopped.
pause