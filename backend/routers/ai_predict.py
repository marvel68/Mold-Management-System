"""AI预测API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from datetime import datetime, timedelta
from typing import Optional
import httpx

from models import get_db, Purchase, WorkHour
from schemas.schemas import AIPrediction

router = APIRouter(prefix="/api/ai", tags=["AI预测"])

# 扣子API配置
COZE_API_TOKEN = "pat_xxx"  # 需要替换为实际token
COZE_BOT_ID = "xxx"  # 需要替换为实际bot ID


async def call_coze_api(prompt: str) -> dict:
    """调用扣子API进行AI预测"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.coze.cn/v1/chat",
                headers={
                    "Authorization": f"Bearer {COZE_API_TOKEN}",
                    "Content-Type": "application/json"
                },
                json={
                    "bot_id": COZE_BOT_ID,
                    "user": "mold_factory",
                    "query": prompt,
                    "stream": False
                }
            )
            if response.status_code == 200:
                return response.json()
            return {"error": f"API调用失败: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/predict/purchase", response_model=AIPrediction)
async def predict_purchase(db: Session = Depends(get_db)):
    """预测下月采购额"""
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    # 获取最近3个月的采购数据
    monthly_data = []
    for i in range(3, 0, -1):
        month = current_month - i
        year = current_year
        if month <= 0:
            month += 12
            year -= 1
        
        total = db.query(func.sum(Purchase.amount_tax)).filter(
            extract('year', Purchase.delivery_date) == year,
            extract('month', Purchase.delivery_date) == month
        ).scalar() or 0
        monthly_data.append(float(total))
    
    # 简单线性预测
    if len(monthly_data) >= 2:
        # 计算趋势
        trend = (monthly_data[-1] - monthly_data[0]) / len(monthly_data)
        predicted = monthly_data[-1] + trend
        
        # 确保预测值合理
        avg = sum(monthly_data) / len(monthly_data)
        if predicted < avg * 0.5:
            predicted = avg
        elif predicted > avg * 1.5:
            predicted = avg * 1.2
    else:
        predicted = sum(monthly_data) / len(monthly_data) if monthly_data else 0
    
    return {
        "prediction_type": "purchase_forecast",
        "value": round(predicted, 2),
        "confidence": 0.75,
        "description": f"基于最近{len(monthly_data)}个月数据预测"
    }


@router.get("/predict/efficiency")
async def predict_efficiency_warning(db: Session = Depends(get_db)):
    """检测效率异常"""
    # 获取平均效率
    avg_eff = db.query(func.avg(WorkHour.efficiency)).scalar() or 100
    
    # 获取低于平均值的操作者
    low_efficiency = db.query(
        WorkHour.operator,
        func.avg(WorkHour.efficiency).label('avg_eff')
    ).group_by(WorkHour.operator).having(
        func.avg(WorkHour.efficiency) < avg_eff * 0.8
    ).all()
    
    warnings = []
    for op in low_efficiency:
        warnings.append({
            "operator": op.operator,
            "efficiency": round(op.avg_eff, 1),
            "issue": "效率偏低，建议关注"
        })
    
    return {
        "average_efficiency": round(avg_eff, 1),
        "warnings": warnings,
        "total_warnings": len(warnings)
    }


@router.get("/predict/supplier")
async def predict_supplier_alerts(db: Session = Depends(get_db)):
    """供应商价格波动预警"""
    # 获取供应商月度采购趋势
    suppliers = db.query(
        Purchase.supplier,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.supplier).having(
        func.sum(Purchase.amount_tax) > 10000  # 金额较大的供应商
    ).limit(5).all()
    
    alerts = []
    for supplier in suppliers:
        # 简化逻辑：检查单价波动
        prices = db.query(Purchase.unit_price_tax).filter(
            Purchase.supplier == supplier.supplier,
            Purchase.unit_price_tax > 0
        ).limit(10).all()
        
        if len(prices) >= 2:
            price_list = [p.unit_price_tax for p in prices]
            max_price = max(price_list)
            min_price = min(price_list)
            
            if max_price > 0:
                fluctuation = (max_price - min_price) / max_price
                if fluctuation > 0.3:  # 波动超过30%
                    alerts.append({
                        "supplier": supplier.supplier,
                        "fluctuation": round(fluctuation * 100, 1),
                        "issue": "价格波动较大"
                    })
    
    return {
        "alerts": alerts,
        "total_alerts": len(alerts)
    }


@router.post("/chat")
async def ai_chat(message: str):
    """AI对话接口"""
    result = await call_coze_api(message)
    return result
