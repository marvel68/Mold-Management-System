"""采购管理API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import date

from models import get_db, Purchase
from schemas.schemas import PurchaseCreate, PurchaseUpdate, PurchaseResponse

router = APIRouter(prefix="/api/purchases", tags=["采购管理"])


@router.get("/", response_model=List[PurchaseResponse])
def list_purchases(
    skip: int = 0,
    limit: int = 100,
    supplier: Optional[str] = None,
    mold_no: Optional[str] = None,
    subdivision: Optional[str] = None,
    project: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """获取采购记录列表"""
    query = db.query(Purchase)
    
    if supplier:
        query = query.filter(Purchase.supplier.contains(supplier))
    if mold_no:
        query = query.filter(Purchase.mold_no.contains(mold_no))
    if subdivision:
        query = query.filter(Purchase.subdivision == subdivision)
    if project:
        query = query.filter(Purchase.project == project)
    if start_date:
        query = query.filter(Purchase.delivery_date >= start_date)
    if end_date:
        query = query.filter(Purchase.delivery_date <= end_date)
    
    return query.order_by(desc(Purchase.delivery_date)).offset(skip).limit(limit).all()


@router.get("/stats")
def get_purchase_stats(db: Session = Depends(get_db)):
    """获取采购统计"""
    # 总金额
    total = db.query(
        func.sum(Purchase.amount_tax).label('total_tax'),
        func.sum(Purchase.amount_no_tax).label('total_no_tax'),
        func.count(Purchase.id).label('count')
    ).first()
    
    # 按供应商统计
    by_supplier = db.query(
        Purchase.supplier,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.supplier).order_by(desc('total')).limit(10).all()
    
    # 按分类统计
    by_category = db.query(
        Purchase.category,
        func.sum(Purchase.amount_tax).label('total')
    ).group_by(Purchase.category).all()
    
    return {
        "total_tax": total.total_tax or 0,
        "total_no_tax": total.total_no_tax or 0,
        "count": total.count or 0,
        "by_supplier": [{"supplier": s.supplier, "total": s.total} for s in by_supplier],
        "by_category": [{"category": c.category, "total": c.total} for c in by_category]
    }


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    """获取单个采购记录"""
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="记录不存在")
    return purchase


@router.post("/", response_model=PurchaseResponse)
def create_purchase(purchase: PurchaseCreate, db: Session = Depends(get_db)):
    """创建采购记录"""
    db_purchase = Purchase(**purchase.model_dump())
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase


@router.put("/{purchase_id}", response_model=PurchaseResponse)
def update_purchase(purchase_id: int, purchase: PurchaseUpdate, db: Session = Depends(get_db)):
    """更新采购记录"""
    db_purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    for key, value in purchase.model_dump().items():
        setattr(db_purchase, key, value)
    
    db.commit()
    db.refresh(db_purchase)
    return db_purchase


@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    """删除采购记录"""
    db_purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    db.delete(db_purchase)
    db.commit()
    return {"message": "删除成功"}
