"""
模具厂管理系统 - FastAPI后端
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# 直接导入模型
from models.database import engine, Base
from models.models import Purchase, WorkHour, PartPrice, Mold

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 导入路由
from routers import (
    purchases_router,
    work_hours_router,
    part_prices_router,
    molds_router,
    dashboard_router,
    ai_predict_router,
    upload_router
)

# 创建FastAPI应用
app = FastAPI(
    title="模具厂管理系统",
    description="传统模具厂Web管理系统，支持采购管理、工时管理、散件标准价查询、AI预测等功能",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(purchases_router)
app.include_router(work_hours_router)
app.include_router(part_prices_router)
app.include_router(molds_router)
app.include_router(dashboard_router)
app.include_router(ai_predict_router)
app.include_router(upload_router)

# 健康检查
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "mold-factory-backend"}

@app.get("/")
def root():
    return {
        "message": "模具厂管理系统API",
        "docs": "/docs",
        "version": "1.0.0"
    }
