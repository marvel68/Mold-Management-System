"""仪表盘数据API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from typing import List
from datetime import datetime

from models import get_db, Purchase, WorkHour, Mold
from schemas.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["仪表盘"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """获取仪表盘统计数据"""
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    # 本月采购总额
    monthly_purchase = db.query(
        func.sum(Purchase.amount_tax).label('total_tax'),
        func.sum(Purchase.amount_no_tax).label('total_no_tax')
    ).filter(
        extract('year', Purchase.delivery_date) == current_year,
        extract('month', Purchase.delivery_date) == current_month
    ).first()
    
    # 在制模具数
    active_molds = db.query(func.count(Mold.id)).filter(
        Mold.status.in_(['in_progress', 'planned'])
    ).scalar()
    
    # 工人数（操作者数量）
    worker_count = db.query(func.count(func.distinct(WorkHour.operator))).scalar()
    
    # 平均效率
    avg_efficiency = db.query(func.avg(WorkHour.efficiency)).scalar() or 0
    
    # 供应商数量
    supplier_count = db.query(func.count(func.distinct(Purchase.supplier))).scalar()
    
    # 周采购趋势（最近12周）
    week_purchases = db.query(
        Purchase.week,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.week).order_by(Purchase.week.desc()).limit(12).all()
    
    # 分类分布
    category_dist = db.query(
        Purchase.category,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.category).all()
    
    # 供应商排名
    supplier_rank = db.query(
        Purchase.supplier,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.supplier).order_by(desc('total')).limit(10).all()
    
    return {
        "total_purchase_tax": monthly_purchase.total_tax or 0,
        "total_purchase_no_tax": monthly_purchase.total_no_tax or 0,
        "active_molds": active_molds or 0,
        "worker_count": worker_count or 0,
        "avg_efficiency": round(avg_efficiency, 2),
        "supplier_count": supplier_count or 0,
        "week_purchases": [{"week": w.week, "total": w.total} for w in week_purchases],
        "category_distribution": [{"category": c.category, "total": c.total} for c in category_dist],
        "supplier_ranking": [{"supplier": s.supplier, "total": s.total} for s in supplier_rank]
    }


@router.get("/trend")
def get_trend_data(
    period: str = "month",  # week, month, quarter
    db: Session = Depends(get_db)
):
    """获取趋势数据"""
    if period == "week":
        # 最近12周趋势
        data = db.query(
            Purchase.week,
            func.sum(Purchase.amount_tax).label('total')
        ).group_by(Purchase.week).order_by(Purchase.week).limit(12).all()
        
        return {"type": "week", "data": [{"label": d.week, "value": d.total} for d in data]}
    
    elif period == "month":
        # 最近12个月趋势
        data = db.query(
            extract('month', Purchase.delivery_date).label('month'),
            func.sum(Purchase.amount_tax).label('total')
        ).group_by('month').order_by('month').limit(12).all()
        
        months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        return {
            "type": "month",
            "data": [{"label": months[int(d.month)-1] if d.month else '', "value": d.total} for d in data]
        }
    
    return {"type": period, "data": []}


@router.get("/efficiency")
def get_efficiency_data(db: Session = Depends(get_db)):
    """获取工人效率数据"""
    # 按操作者统计效率
    operators = db.query(
        WorkHour.operator,
        func.avg(WorkHour.efficiency).label('avg_eff'),
        func.sum(WorkHour.actual_hours).label('total_hours'),
        func.count(WorkHour.id).label('record_count')
    ).group_by(WorkHour.operator).having(
        func.count(WorkHour.id) >= 5  # 至少5条记录
    ).order_by(desc('avg_eff')).limit(15).all()
    
    return {
        "operators": [
            {
                "name": o.operator,
                "efficiency": round(o.avg_eff, 1) if o.avg_eff else 0,
                "total_hours": round(o.total_hours, 1) if o.total_hours else 0,
                "record_count": o.record_count
            }
            for o in operators
        ]
    }
