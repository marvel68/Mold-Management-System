"""供应商管理API"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List, Optional
from pydantic import BaseModel

from models import get_db, Supplier, Purchase, Attachment
# BaseResponse not needed

router = APIRouter(prefix="/api/suppliers", tags=["供应商管理"])


# Pydantic 模型
class SupplierBase(BaseModel):
    code: str
    name: str
    type: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    tax_rate: Optional[float] = 0.13
    remark: Optional[str] = None
    status: Optional[str] = "active"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    tax_rate: Optional[float] = None
    remark: Optional[str] = None
    status: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    thumbnail_path: Optional[str] = None
    version: Optional[int] = 1
    upload_user: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplierResponse(SupplierBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True


class SupplierListResponse(BaseModel):
    items: List[SupplierResponse]
    total: int
    page: int
    page_size: int


@router.get("/", response_model=SupplierListResponse)
def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None, description="供应商类型"),
    status: Optional[str] = Query(None, description="状态"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    db: Session = Depends(get_db)
):
    """获取供应商列表（支持分页、筛选）"""
    query = db.query(Supplier)
    
    if type:
        query = query.filter(Supplier.type == type)
    if status:
        query = query.filter(Supplier.status == status)
    if keyword:
        query = query.filter(
            (Supplier.name.contains(keyword)) | 
            (Supplier.code.contains(keyword)) |
            (Supplier.contact_person.contains(keyword))
        )
    
    total = query.count()
    items = query.order_by(Supplier.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    
    return SupplierListResponse(
        items=[SupplierResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    """创建供应商"""
    # 检查编码唯一性
    existing = db.query(Supplier).filter(Supplier.code == supplier.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="供应商编码已存在")
    
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    
    return SupplierResponse.model_validate(db_supplier)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """获取供应商详情（含附件列表）"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    # 获取附件
    attachments = db.query(Attachment).filter(
        Attachment.related_type == "supplier",
        Attachment.related_id == supplier_id
    ).all()
    
    response = SupplierResponse.model_validate(supplier)
    response.attachments = [AttachmentResponse.model_validate(a) for a in attachments]
    
    return response


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier: SupplierUpdate, db: Session = Depends(get_db)):
    """更新供应商"""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    update_data = supplier.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    
    return SupplierResponse.model_validate(db_supplier)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """删除供应商"""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="供应商不存在")
    
    db.delete(db_supplier)
    db.commit()
    
    return {"success": True, "message": "删除成功"}


@router.get("/{supplier_id}/attachments", response_model=List[AttachmentResponse])
def get_supplier_attachments(supplier_id: int, db: Session = Depends(get_db)):
    """获取供应商的所有附件"""
    attachments = db.query(Attachment).filter(
        Attachment.related_type == "supplier",
        Attachment.related_id == supplier_id
    ).all()
    
    return [AttachmentResponse.model_validate(a) for a in attachments]


@router.post("/init-from-purchases")
def init_suppliers_from_purchases(db: Session = Depends(get_db)):
    """从采购记录中提取所有供应商并创建记录"""
    # 获取所有不同的供应商
    suppliers = db.query(distinct(Purchase.supplier)).filter(
        Purchase.supplier != None,
        Purchase.supplier != ''
    ).all()
    
    created_count = 0
    existed_count = 0
    
    for (supplier_name,) in suppliers:
        # 检查是否已存在
        existing = db.query(Supplier).filter(Supplier.name == supplier_name).first()
        if existing:
            existed_count += 1
            continue
        
        # 生成编码
        code = f"SUP{len(suppliers):04d}"
        # 简单分类判断
        supplier_type = None
        if any(keyword in supplier_name for keyword in ['模胚', '模具']):
            supplier_type = '模胚'
        elif any(keyword in supplier_name for keyword in ['热流道', '热咀']):
            supplier_type = '热流道'
        elif any(keyword in supplier_name for keyword in ['钢材', '钢料', '特钢']):
            supplier_type = '钢材'
        elif any(keyword in supplier_name for keyword in ['铜', '铜材', '铜公']):
            supplier_type = '铜材'
        
        db_supplier = Supplier(
            code=code,
            name=supplier_name,
            type=supplier_type
        )
        db.add(db_supplier)
        created_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "created": created_count,
        "existed": existed_count,
        "message": f"成功创建{created_count}个供应商，{existed_count}个已存在"
    }


@router.get("/types/list")
def list_supplier_types(db: Session = Depends(get_db)):
    """获取供应商类型列表"""
    types = db.query(Supplier.type).distinct().filter(Supplier.type != None).all()
    return {"types": [t[0] for t in types if t[0]]}
