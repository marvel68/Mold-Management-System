#!/bin/bash
echo "正在停止模具厂管理系统..."
pkill -f "uvicorn main:app.*8011" 2>/dev/null && echo "后端已停止" || echo "后端未运行"
pkill -f "vite.*3001" 2>/dev/null && echo "前端已停止" || echo "前端未运行"
echo "停止完成"
