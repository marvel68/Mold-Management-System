"""周透视API"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, timedelta
import calendar

from models import get_db, Purchase, WeekDefinition

router = APIRouter(prefix="/api/purchases", tags=["周透视"])

# Pydantic 模型
class WeekData(BaseModel):
    week_number: int
    week_name: str
    start_date: str
    end_date: str
    amount: float

class SupplierWeekData(BaseModel):
    supplier: str
    category: str
    weeks: List[WeekData]
    total: float

class WeeklyPivotResponse(BaseModel):
    year: int
    month: int
    suppliers: List[SupplierWeekData]
    weeks: List[WeekData]
    total: float

def init_weeks_for_year(year: int, db: Session):
    """初始化一年的周定义"""
    existing = db.query(WeekDefinition).filter(WeekDefinition.year == year).first()
    if existing:
        return
    
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)
    
    first_monday = year_start
    while first_monday.weekday() != 0:
        first_monday += timedelta(days=1)
    
    week_num = 1
    current_monday = first_monday
    
    while current_monday.year <= year and week_num <= 53:
        current_sunday = current_monday + timedelta(days=6)
        if current_sunday.year > year:
            current_sunday = year_end
        
        week_def = WeekDefinition(
            year=year,
            week_number=week_num,
            week_name=f"W{week_num:02d}",
            start_date=current_monday,
            end_date=current_sunday
        )
        db.add(week_def)
        
        week_num += 1
        current_monday += timedelta(days=7)
    
    db.commit()


@router.get("/weekly-pivot", response_model=WeeklyPivotResponse)
def get_weekly_pivot(
    year: int = Query(2026, description="年份"),
    month: int = Query(1, ge=1, le=12, description="月份"),
    supplier: Optional[str] = Query(None, description="供应商筛选"),
    category: Optional[str] = Query(None, description="分类筛选"),
    db: Session = Depends(get_db)
):
    """获取周透视数据"""
    init_weeks_for_year(year, db)
    
    month_start = date(year, month, 1)
    month_end = date(year, month, calendar.monthrange(year, month)[1])
    
    weeks_in_month = db.query(WeekDefinition).filter(
        WeekDefinition.year == year,
        WeekDefinition.start_date <= month_end,
        WeekDefinition.end_date >= month_start
    ).order_by(WeekDefinition.week_number).all()
    
    weeks_list = [
        {
            "week_number": w.week_number,
            "week_name": w.week_name,
            "start_date": w.start_date.isoformat(),
            "end_date": w.end_date.isoformat(),
            "amount": 0.0
        }
        for w in weeks_in_month
    ]
    
    # 查询该月每条采购记录
    query = db.query(Purchase).filter(
        and_(
            Purchase.delivery_date >= month_start,
            Purchase.delivery_date <= month_end
        )
    )
    if supplier:
        query = query.filter(Purchase.supplier == supplier)
    if category:
        query = query.filter(Purchase.category == category)
    
    purchases = query.all()
    
    # 按供应商+分类+周次聚合
    supplier_data = {}
    for p in purchases:
        sup_name = p.supplier or '未知供应商'
        cat = p.category or '未分类'
        key = (sup_name, cat)
        
        # 找到该采购日期所在的周
        week_num = None
        for w in weeks_in_month:
            if w.start_date <= p.delivery_date <= w.end_date:
                week_num = w.week_number
                break
        
        if week_num is None:
            continue
        
        if key not in supplier_data:
            supplier_data[key] = {
                "supplier": sup_name,
                "category": cat,
                "weeks": {},
                "total": 0.0
            }
        
        amount = p.amount_tax or 0
        if week_num not in supplier_data[key]["weeks"]:
            supplier_data[key]["weeks"][week_num] = 0.0
        supplier_data[key]["weeks"][week_num] += amount
        supplier_data[key]["total"] += amount
    
    result_suppliers = []
    grand_total = 0.0
    
    for (sup_name, cat), data in sorted(supplier_data.items()):
        supplier_weeks = []
        for w in weeks_list:
            wn = w["week_number"]
            supplier_weeks.append(WeekData(
                week_number=wn,
                week_name=w["week_name"],
                start_date=w["start_date"],
                end_date=w["end_date"],
                amount=round(data["weeks"].get(wn, 0.0), 2)
            ))
        
        result_suppliers.append(SupplierWeekData(
            supplier=data["supplier"],
            category=data["category"],
            weeks=supplier_weeks,
            total=round(data["total"], 2)
        ))
        grand_total += data["total"]
    
    # 每周总计
    for w in weeks_list:
        wn = w["week_number"]
        w["amount"] = round(sum(
            s["weeks"].get(wn, 0) for s in supplier_data.values()
        ), 2)
    
    return WeeklyPivotResponse(
        year=year,
        month=month,
        suppliers=result_suppliers,
        weeks=[WeekData(**w) for w in weeks_list],
        total=round(grand_total, 2)
    )


@router.get("/week-definitions")
def list_week_definitions(
    year: int = Query(2026, description="年份"),
    db: Session = Depends(get_db)
):
    """获取指定年份的周定义列表"""
    init_weeks_for_year(year, db)
    weeks = db.query(WeekDefinition).filter(
        WeekDefinition.year == year
    ).order_by(WeekDefinition.week_number).all()
    
    return {
        "year": year,
        "weeks": [
            {
                "week_number": w.week_number,
                "week_name": w.week_name,
                "start_date": w.start_date.isoformat(),
                "end_date": w.end_date.isoformat()
            }
            for w in weeks
        ]
    }


@router.post("/week-definitions/init")
def init_week_definitions(
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db)
):
    """手动初始化指定年份的周定义"""
    init_weeks_for_year(year, db)
    return {"success": True, "message": f"{year}年周定义已初始化"}
