@echo off
chcp 65001 >nul
echo ========================================
echo   模具厂管理系统 启动脚本
echo ========================================
echo.

:: 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.10+
    pause
    exit /b 1
)

:: 检查Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js 18+
    pause
    exit /b 1
)

:: 获取当前目录
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

:: 安装后端依赖
echo [1/4] 安装后端依赖...
cd /d "%PROJECT_DIR%\backend"
pip install -r requirements.txt -q
if errorlevel 1 (
    echo [警告] 后端依赖安装可能有问题，继续...
)

:: 安装前端依赖
echo [2/4] 安装前端依赖...
cd /d "%PROJECT_DIR%\frontend"
if not exist node_modules (
    echo 首次运行，安装npm依赖...
    call npm install
)
cd /d "%PROJECT_DIR%"

:: 创建必要目录
echo [3/4] 创建数据目录...
if not exist data mkdir data
if not exist uploads mkdir uploads
if not exist uploads\attachments mkdir uploads\attachments
if not exist uploads\attachments\thumbnails mkdir uploads\attachments\thumbnails

:: 杀死旧进程
echo [4/4] 停止旧服务（如有）...
taskkill /f /fi "WINDOWTITLE eq 模具厂后端*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq 模具厂前端*" >nul 2>&1
timeout /t 2 /nobreak >nul

:: 启动后端
echo 启动后端 (端口8011)...
start "模具厂后端" cmd /c "cd /d \"%PROJECT_DIR%\backend\" && python -m uvicorn main:app --host 0.0.0.0 --port 8011"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo 启动前端 (端口3001)...
start "模具厂前端" cmd /c "cd /d \"%PROJECT_DIR%\frontend\" && npx vite --host 0.0.0.0 --port 3001"

echo.
echo ========================================
echo   系统已启动！
echo   后端: http://localhost:8011
echo   前端: http://localhost:3001
echo   API文档: http://localhost:8011/docs
echo ========================================
echo.
echo 按任意键关闭此窗口（服务将继续运行）...
pause >nul
