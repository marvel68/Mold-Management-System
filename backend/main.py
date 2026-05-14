"""
模具厂管理系统 - FastAPI后端
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from models.database import engine, Base
from models.models import Purchase, WorkHour, PartPrice, Mold, Supplier, Attachment, WeekDefinition

Base.metadata.create_all(bind=engine)

from routers import (
    weekly_pivot_router,
    purchases_router,
    work_hours_router,
    part_prices_router,
    molds_router,
    dashboard_router,
    ai_predict_router,
    upload_router,
    suppliers_router,
    attachments_router,
)

app = FastAPI(
    title="模具厂管理系统",
    description="传统模具厂Web管理系统，支持采购管理、工时管理、散件标准价查询、AI预测等功能",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("/app/mold-factory/uploads/attachments", exist_ok=True)
os.makedirs("/app/mold-factory/uploads/attachments/thumbnails", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/mold-factory/uploads"), name="uploads")

# 周透视必须在purchases之前注册，避免 /{purchase_id} 抢匹配
app.include_router(weekly_pivot_router)
app.include_router(purchases_router)
app.include_router(work_hours_router)
app.include_router(part_prices_router)
app.include_router(molds_router)
app.include_router(dashboard_router)
app.include_router(ai_predict_router)
app.include_router(upload_router)
app.include_router(suppliers_router)
app.include_router(attachments_router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "mold-factory-backend"}

@app.get("/")
def root():
    return {"message": "模具厂管理系统API v2.0", "docs": "/docs", "version": "2.0.0"}
