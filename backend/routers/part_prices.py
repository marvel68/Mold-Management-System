"""散件标准价API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from models import get_db, PartPrice
from schemas.schemas import PartPriceCreate, PartPriceResponse

router = APIRouter(prefix="/api/part-prices", tags=["散件标准价"])


@router.get("/", response_model=List[PartPriceResponse])
def list_part_prices(
    skip: int = 0,
    limit: int = 200,
    part_code: Optional[str] = None,
    part_name: Optional[str] = None,
    size_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """获取散件标准价列表"""
    query = db.query(PartPrice)
    
    if part_code:
        query = query.filter(PartPrice.part_code.contains(part_code))
    if part_name:
        query = query.filter(PartPrice.part_name.contains(part_name))
    if size_type:
        query = query.filter(PartPrice.size_type == size_type)
    
    return query.offset(skip).limit(limit).all()


@router.get("/categories")
def get_part_categories(db: Session = Depends(get_db)):
    """获取所有散件分类"""
    categories = db.query(
        PartPrice.part_code,
        PartPrice.part_name
    ).distinct().order_by(PartPrice.part_code).all()
    
    return [{"code": c.part_code, "name": c.part_name} for c in categories]


@router.get("/{part_id}", response_model=PartPriceResponse)
def get_part_price(part_id: int, db: Session = Depends(get_db)):
    """获取单个散件价格"""
    part_price = db.query(PartPrice).filter(PartPrice.id == part_id).first()
    if not part_price:
        raise HTTPException(status_code=404, detail="记录不存在")
    return part_price


@router.get("/calculate/")
def calculate_price(
    part_code: str = Query(..., description="散件代码"),
    length: float = Query(..., description="长度"),
    width: float = Query(..., description="宽度"),
    height: float = Query(..., description="高度"),
    db: Session = Depends(get_db)
):
    """根据尺寸计算推荐规格和价格"""
    # 查找匹配的规格
    parts = db.query(PartPrice).filter(
        PartPrice.part_code == part_code
    ).all()
    
    if not parts:
        raise HTTPException(status_code=404, detail="未找到该散件")
    
    # 简单匹配：选择尺寸最接近的规格
    best_match = None
    min_diff = float('inf')
    
    for part in parts:
        diff = abs(part.length - length) + abs(part.width - width) + abs(part.height - height)
        if diff < min_diff:
            min_diff = diff
            best_match = part
    
    if best_match:
        return {
            "recommended": True,
            "part": PartPriceResponse.model_validate(best_match),
            "input_dimensions": {"length": length, "width": width, "height": height},
            "match_dimensions": {
                "length": best_match.length,
                "width": best_match.width,
                "height": best_match.height
            }
        }
    
    return {"recommended": False, "parts": [PartPriceResponse.model_validate(p) for p in parts]}


@router.post("/", response_model=PartPriceResponse)
def create_part_price(part_price: PartPriceCreate, db: Session = Depends(get_db)):
    """创建散件标准价"""
    db_part_price = PartPrice(**part_price.model_dump())
    db.add(db_part_price)
    db.commit()
    db.refresh(db_part_price)
    return db_part_price


@router.post("/bulk", response_model=dict)
def bulk_create_part_prices(part_prices: List[PartPriceCreate], db: Session = Depends(get_db)):
    """批量创建散件标准价"""
    created = []
    for pp in part_prices:
        db_part = PartPrice(**pp.model_dump())
        db.add(db_part)
        created.append(db_part)
    
    db.commit()
    return {"created": len(created)}
