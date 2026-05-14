"""
数据库模型定义
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, func
from .database import Base


class Purchase(Base):
    """采购记录表 - 对应采购外协加工明细表"""
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    delivery_date = Column(Date, nullable=False, index=True)
    delivery_no = Column(String(50), index=True)
    supplier = Column(String(100), index=True)
    category = Column(String(50))
    subdivision = Column(String(100), index=True)
    project = Column(String(50), index=True)
    process_type = Column(String(50), index=True)
    mold_no = Column(String(50), index=True)
    content = Column(Text)
    quantity = Column(Float)
    unit = Column(String(20))
    unit_price_tax = Column(Float)
    unit_price_no_tax = Column(Float)
    amount_tax = Column(Float)
    amount_no_tax = Column(Float)
    tax_rate = Column(Float)
    week = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class WorkHour(Base):
    """工时记录表 - 对应模具内部制作数据支撑表"""
    __tablename__ = "work_hours"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    mold_no = Column(String(50), index=True)
    work_item = Column(String(200))
    work_content = Column(Text)
    process_qty = Column(Integer)
    work_type = Column(String(50), index=True)
    subdivision = Column(String(100), index=True)
    project = Column(String(50), index=True)
    process_category = Column(String(50), index=True)
    operator = Column(String(50), index=True)
    estimated_hours = Column(Float)
    actual_hours = Column(Float)
    efficiency = Column(Float)
    unit_price = Column(Float)
    amount_tax = Column(Float)
    amount_no_tax = Column(Float)
    week = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class PartPrice(Base):
    """散件标准价表"""
    __tablename__ = "part_prices"

    id = Column(Integer, primary_key=True, index=True)
    part_code = Column(String(20), index=True)
    part_name = Column(String(100))
    size_type = Column(String(20))
    length = Column(Float)
    width = Column(Float)
    height = Column(Float)
    steel_cost_1 = Column(Float)
    steel_cost_2 = Column(Float)
    milling = Column(Float)
    cnc_programming = Column(Float)
    cnc_roughing = Column(Float)
    heat_treatment = Column(Float)
    grinding = Column(Float)
    cnc_finishing = Column(Float)
    slow_wire = Column(Float)
    medium_wire = Column(Float)
    fast_wire = Column(Float)
    edm = Column(Float)
    polishing = Column(Float)
    lathe = Column(Float)
    deep_hole = Column(Float)
    measurement = Column(Float)
    assembly = Column(Float)
    total_cost = Column(Float)
    tax_rate = Column(Float, default=0.13)
    admin_fee = Column(Float, default=0.1)
    final_price = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Mold(Base):
    """模具项目表"""
    __tablename__ = "molds"

    id = Column(Integer, primary_key=True, index=True)
    mold_no = Column(String(50), unique=True, index=True)
    mold_name = Column(String(200))
    project = Column(String(50))
    status = Column(String(20), default='in_progress')
    start_date = Column(Date)
    expected_end_date = Column(Date)
    actual_end_date = Column(Date)
    purchase_cost = Column(Float, default=0)
    internal_cost = Column(Float, default=0)
    total_cost = Column(Float, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Supplier(Base):
    """供应商表"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50))  # 模胚/热流道/钢材/铜材/配件/外协加工
    category = Column(String(50))
    contact_person = Column(String(50))
    contact_phone = Column(String(50))
    contact_email = Column(String(100))
    address = Column(Text)
    bank_name = Column(String(100))
    bank_account = Column(String(100))
    tax_rate = Column(Float, default=0.13)
    remark = Column(Text)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Attachment(Base):
    """附件表"""
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    file_size = Column(Integer)
    category = Column(String(50))  # 公司简介/协议/图纸/报价单
    related_type = Column(String(50))  # supplier/part/mold
    related_id = Column(Integer)
    thumbnail_path = Column(String(500))  # 缩略图路径
    version = Column(Integer, default=1)
    upload_user = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())


class WeekDefinition(Base):
    """周定义表"""
    __tablename__ = "week_definitions"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    week_number = Column(Integer, nullable=False)
    week_name = Column(String(20))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
