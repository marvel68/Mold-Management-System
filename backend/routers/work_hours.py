"""工时管理API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import date

from models import get_db, WorkHour
from schemas.schemas import WorkHourCreate, WorkHourUpdate, WorkHourResponse

router = APIRouter(prefix="/api/work-hours", tags=["工时管理"])


@router.get("/", response_model=List[WorkHourResponse])
def list_work_hours(
    skip: int = 0,
    limit: int = 100,
    operator: Optional[str] = None,
    mold_no: Optional[str] = None,
    work_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """获取工时记录列表"""
    query = db.query(WorkHour)
    
    if operator:
        query = query.filter(WorkHour.operator.contains(operator))
    if mold_no:
        query = query.filter(WorkHour.mold_no.contains(mold_no))
    if work_type:
        query = query.filter(WorkHour.work_type == work_type)
    if start_date:
        query = query.filter(WorkHour.date >= start_date)
    if end_date:
        query = query.filter(WorkHour.date <= end_date)
    
    return query.order_by(desc(WorkHour.date)).offset(skip).limit(limit).all()


@router.get("/stats")
def get_work_hour_stats(db: Session = Depends(get_db)):
    """获取工时统计"""
    # 总工时
    total = db.query(
        func.sum(WorkHour.actual_hours).label('total_hours'),
        func.avg(WorkHour.efficiency).label('avg_efficiency'),
        func.count(WorkHour.id).label('count')
    ).first()
    
    # 按操作者统计
    by_operator = db.query(
        WorkHour.operator,
        func.sum(WorkHour.actual_hours).label('total_hours'),
        func.avg(WorkHour.efficiency).label('avg_efficiency')
    ).group_by(WorkHour.operator).order_by(desc('total_hours')).limit(10).all()
    
    # 按工种统计
    by_work_type = db.query(
        WorkHour.work_type,
        func.sum(WorkHour.actual_hours).label('total_hours')
    ).group_by(WorkHour.work_type).all()
    
    return {
        "total_hours": total.total_hours or 0,
        "avg_efficiency": total.avg_efficiency or 0,
        "count": total.count or 0,
        "by_operator": [
            {"operator": o.operator, "total_hours": o.total_hours, "avg_efficiency": o.avg_efficiency} 
            for o in by_operator
        ],
        "by_work_type": [
            {"work_type": w.work_type, "total_hours": w.total_hours} 
            for w in by_work_type
        ]
    }


@router.get("/{work_hour_id}", response_model=WorkHourResponse)
def get_work_hour(work_hour_id: int, db: Session = Depends(get_db)):
    """获取单个工时记录"""
    work_hour = db.query(WorkHour).filter(WorkHour.id == work_hour_id).first()
    if not work_hour:
        raise HTTPException(status_code=404, detail="记录不存在")
    return work_hour


@router.post("/", response_model=WorkHourResponse)
def create_work_hour(work_hour: WorkHourCreate, db: Session = Depends(get_db)):
    """创建工时记录"""
    db_work_hour = WorkHour(**work_hour.model_dump())
    db.add(db_work_hour)
    db.commit()
    db.refresh(db_work_hour)
    return db_work_hour


@router.put("/{work_hour_id}", response_model=WorkHourResponse)
def update_work_hour(work_hour_id: int, work_hour: WorkHourUpdate, db: Session = Depends(get_db)):
    """更新工时记录"""
    db_work_hour = db.query(WorkHour).filter(WorkHour.id == work_hour_id).first()
    if not db_work_hour:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    for key, value in work_hour.model_dump().items():
        setattr(db_work_hour, key, value)
    
    db.commit()
    db.refresh(db_work_hour)
    return db_work_hour


@router.delete("/{work_hour_id}")
def delete_work_hour(work_hour_id: int, db: Session = Depends(get_db)):
    """删除工时记录"""
    db_work_hour = db.query(WorkHour).filter(WorkHour.id == work_hour_id).first()
    if not db_work_hour:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    db.delete(db_work_hour)
    db.commit()
    return {"message": "删除成功"}
