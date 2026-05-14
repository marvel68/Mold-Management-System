@echo off
chcp 65001 >nul
echo 正在停止模具厂管理系统...
taskkill /f /fi "WINDOWTITLE eq 模具厂后端*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq 模具厂前端*" >nul 2>&1
echo.
echo 已停止所有服务
echo.
pause
