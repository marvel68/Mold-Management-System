"""模具项目管理API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional

from models import get_db, Mold, Purchase, WorkHour
from schemas.schemas import MoldCreate, MoldUpdate, MoldResponse

router = APIRouter(prefix="/api/molds", tags=["模具管理"])


@router.get("/", response_model=List[MoldResponse])
def list_molds(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    project: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取模具列表"""
    query = db.query(Mold)
    
    if status:
        query = query.filter(Mold.status == status)
    if project:
        query = query.filter(Mold.project == project)
    
    return query.order_by(desc(Mold.created_at)).offset(skip).limit(limit).all()


@router.get("/stats")
def get_mold_stats(db: Session = Depends(get_db)):
    """获取模具统计"""
    # 总模具数
    total = db.query(func.count(Mold.id)).scalar()
    
    # 按状态统计
    by_status = db.query(
        Mold.status,
        func.count(Mold.id).label('count')
    ).group_by(Mold.status).all()
    
    # 获取所有模具编号（有采购或工时记录的）
    mold_nos = set()
    
    purchases = db.query(Purchase.mold_no).distinct().all()
    for p in purchases:
        if p.mold_no:
            mold_nos.add(p.mold_no)
    
    work_hours = db.query(WorkHour.mold_no).distinct().all()
    for w in work_hours:
        if w.mold_no:
            mold_nos.add(w.mold_no)
    
    return {
        "total_molds": total or 0,
        "by_status": [{"status": s.status, "count": s.count} for s in by_status],
        "unique_mold_nos": len(mold_nos)
    }


@router.get("/{mold_id}", response_model=MoldResponse)
def get_mold(mold_id: int, db: Session = Depends(get_db)):
    """获取单个模具"""
    mold = db.query(Mold).filter(Mold.id == mold_id).first()
    if not mold:
        raise HTTPException(status_code=404, detail="模具不存在")
    return mold


@router.get("/by-no/{mold_no}")
def get_mold_by_no(mold_no: str, db: Session = Depends(get_db)):
    """根据模具编号获取模具详情"""
    # 获取采购成本
    purchases = db.query(
        func.sum(Purchase.amount_tax).label('total')
    ).filter(Purchase.mold_no == mold_no).first()
    
    # 获取内部工时成本
    work_hours = db.query(
        func.sum(WorkHour.amount_tax).label('total')
    ).filter(WorkHour.mold_no == mold_no).first()
    
    # 采购明细
    purchase_list = db.query(Purchase).filter(Purchase.mold_no == mold_no).all()
    
    # 工时明细
    work_hour_list = db.query(WorkHour).filter(WorkHour.mold_no == mold_no).all()
    
    purchase_cost = purchases.total or 0
    internal_cost = work_hours.total or 0
    
    return {
        "mold_no": mold_no,
        "purchase_cost": purchase_cost,
        "internal_cost": internal_cost,
        "total_cost": purchase_cost + internal_cost,
        "purchases": purchase_list,
        "work_hours": work_hour_list
    }


@router.post("/", response_model=MoldResponse)
def create_mold(mold: MoldCreate, db: Session = Depends(get_db)):
    """创建模具"""
    db_mold = Mold(**mold.model_dump())
    db.add(db_mold)
    db.commit()
    db.refresh(db_mold)
    return db_mold


@router.put("/{mold_id}", response_model=MoldResponse)
def update_mold(mold_id: int, mold: MoldUpdate, db: Session = Depends(get_db)):
    """更新模具"""
    db_mold = db.query(Mold).filter(Mold.id == mold_id).first()
    if not db_mold:
        raise HTTPException(status_code=404, detail="模具不存在")
    
    for key, value in mold.model_dump().items():
        setattr(db_mold, key, value)
    
    db.commit()
    db.refresh(db_mold)
    return db_mold


@router.delete("/{mold_id}")
def delete_mold(mold_id: int, db: Session = Depends(get_db)):
    """删除模具"""
    db_mold = db.query(Mold).filter(Mold.id == mold_id).first()
    if not db_mold:
        raise HTTPException(status_code=404, detail="模具不存在")
    
    db.delete(db_mold)
    db.commit()
    return {"message": "删除成功"}
