#!/bin/bash
echo "========================================"
echo "  模具厂管理系统 启动脚本"
echo "========================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 安装后端依赖
echo "[1/4] 安装后端依赖..."
cd backend
pip install -r requirements.txt -q
cd ..

# 安装前端依赖
echo "[2/4] 安装前端依赖..."
cd frontend
[ ! -d node_modules ] && npm install
cd ..

# 创建目录
echo "[3/4] 创建数据目录..."
mkdir -p data uploads/attachments/thumbnails

# 停止旧服务
echo "[4/4] 停止旧服务（如有）..."
pkill -f "uvicorn main:app.*8011" 2>/dev/null || true
pkill -f "vite.*3001" 2>/dev/null || true
sleep 1

# 启动后端
echo "启动后端 (端口8011)..."
cd backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8011 > /tmp/backend_8011.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 2

# 启动前端
echo "启动前端 (端口3001)..."
cd frontend
nohup npx vite --host 0.0.0.0 --port 3001 > /tmp/frontend_3001.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  系统已启动！"
echo "  后端 PID: $BACKEND_PID"
echo "  前端 PID: $FRONTEND_PID"
echo "  后端: http://localhost:8011"
echo "  前端: http://localhost:3001"
echo "  API文档: http://localhost:8011/docs"
echo "========================================"
echo ""
echo "日志文件: /tmp/backend_8011.log, /tmp/frontend_3001.log"
echo "停止服务: ./stop.sh"
