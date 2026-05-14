"""Pydantic模型定义"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ========== 采购相关 ==========
class PurchaseBase(BaseModel):
    delivery_date: date
    delivery_no: Optional[str] = None
    supplier: str
    category: Optional[str] = None
    subdivision: Optional[str] = None
    project: Optional[str] = None
    process_type: Optional[str] = None
    mold_no: Optional[str] = None
    content: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price_tax: Optional[float] = None
    unit_price_no_tax: Optional[float] = None
    amount_tax: Optional[float] = None
    amount_no_tax: Optional[float] = None
    tax_rate: Optional[float] = None
    week: Optional[str] = None


class PurchaseCreate(PurchaseBase):
    pass


class PurchaseUpdate(PurchaseBase):
    pass


class PurchaseResponse(PurchaseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 工时相关 ==========
class WorkHourBase(BaseModel):
    date: date
    mold_no: Optional[str] = None
    work_item: Optional[str] = None
    work_content: Optional[str] = None
    process_qty: Optional[int] = None
    work_type: Optional[str] = None
    subdivision: Optional[str] = None
    project: Optional[str] = None
    process_category: Optional[str] = None
    operator: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    efficiency: Optional[float] = None
    unit_price: Optional[float] = None
    amount_tax: Optional[float] = None
    amount_no_tax: Optional[float] = None
    week: Optional[str] = None


class WorkHourCreate(WorkHourBase):
    pass


class WorkHourUpdate(WorkHourBase):
    pass


class WorkHourResponse(WorkHourBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 散件标准价 ==========
class PartPriceBase(BaseModel):
    part_code: str
    part_name: str
    size_type: str
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    total_cost: Optional[float] = None
    final_price: Optional[float] = None


class PartPriceCreate(PartPriceBase):
    pass


class PartPriceResponse(PartPriceBase):
    id: int
    steel_cost_1: Optional[float] = None
    steel_cost_2: Optional[float] = None
    milling: Optional[float] = None
    cnc_programming: Optional[float] = None
    cnc_roughing: Optional[float] = None
    heat_treatment: Optional[float] = None
    grinding: Optional[float] = None
    cnc_finishing: Optional[float] = None
    slow_wire: Optional[float] = None
    medium_wire: Optional[float] = None
    fast_wire: Optional[float] = None
    edm: Optional[float] = None
    polishing: Optional[float] = None
    lathe: Optional[float] = None
    deep_hole: Optional[float] = None
    measurement: Optional[float] = None
    assembly: Optional[float] = None
    tax_rate: Optional[float] = None
    admin_fee: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 模具项目 ==========
class MoldBase(BaseModel):
    mold_no: str
    mold_name: Optional[str] = None
    project: Optional[str] = None
    status: Optional[str] = 'in_progress'
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None


class MoldCreate(MoldBase):
    pass


class MoldUpdate(MoldBase):
    pass


class MoldResponse(MoldBase):
    id: int
    purchase_cost: Optional[float] = 0
    internal_cost: Optional[float] = 0
    total_cost: Optional[float] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== 统计数据 ==========
class DashboardStats(BaseModel):
    total_purchase_tax: float  # 本月采购总额（含税）
    total_purchase_no_tax: float  # 本月采购总额（不含税）
    active_molds: int  # 在制模具数
    worker_count: int  # 工人数
    avg_efficiency: float  # 平均效率
    supplier_count: int  # 供应商数
    week_purchases: List[dict]  # 周采购趋势
    category_distribution: List[dict]  # 分类分布
    supplier_ranking: List[dict]  # 供应商排名


class AIPrediction(BaseModel):
    prediction_type: str
    value: float
    confidence: float
    description: str
