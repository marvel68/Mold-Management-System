@echo off
chcp 65001 >nul
echo ========================================
echo   模具厂管理系统 首次安装
echo ========================================
echo.

:: 获取当前目录
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

:: 安装后端依赖
echo [1/3] 安装Python依赖...
cd /d "%PROJECT_DIR%\backend"
pip install -r requirements.txt
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)

:: 安装前端依赖
echo [2/3] 安装Node.js依赖...
cd /d "%PROJECT_DIR%\frontend"
call npm install
if errorlevel 1 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)

:: 创建目录
echo [3/3] 创建数据目录...
cd /d "%PROJECT_DIR%"
if not exist data mkdir data
if not exist uploads mkdir uploads
if not exist uploads\attachments mkdir uploads\attachments
if not exist uploads\attachments\thumbnails mkdir uploads\attachments\thumbnails

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 请运行 start.bat 启动系统
echo.
pause
