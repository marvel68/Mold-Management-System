"""Excel上传导入API"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List
import pandas as pd
import shutil

from config import UPLOADS_DIR
from models import get_db, Purchase, WorkHour, PartPrice
from schemas.schemas import PurchaseCreate, WorkHourCreate, PartPriceCreate

router = APIRouter(prefix="/api/upload", tags=["数据导入"])

# 确保上传目录存在
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/purchase")
async def upload_purchase(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """上传采购Excel文件"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="仅支持.xlsx格式")
    
    file_path = UPLOADS_DIR / f"purchase_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        # 读取Excel
        df = pd.read_excel(file_path, sheet_name='采购外协加工明细表')
        
        # 清理列名中的空格
        df.columns = df.columns.str.strip()
        
        # 导入数据
        imported = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # 处理日期
                delivery_date = row.get('送货日期')
                if pd.isna(delivery_date):
                    continue
                
                if isinstance(delivery_date, str):
                    delivery_date = pd.to_datetime(delivery_date).date()
                elif isinstance(delivery_date, datetime):
                    delivery_date = delivery_date.date()
                else:
                    delivery_date = pd.to_datetime(delivery_date).date()
                
                purchase = Purchase(
                    delivery_date=delivery_date,
                    delivery_no=str(row.get('送货单号', '')) if pd.notna(row.get('送货单号')) else None,
                    supplier=str(row.get('供应商', '')) if pd.notna(row.get('供应商')) else '',
                    category=str(row.get('分类', '')) if pd.notna(row.get('分类')) else None,
                    subdivision=str(row.get('细分', '')) if pd.notna(row.get('细分')) else None,
                    project=str(row.get('项目', '')) if pd.notna(row.get('项目')) else None,
                    process_type=str(row.get('加工类别', '')) if pd.notna(row.get('加工类别')) else None,
                    mold_no=str(row.get('模具编号', '')) if pd.notna(row.get('模具编号')) else None,
                    content=str(row.get('内   容', '')) if pd.notna(row.get('内   容')) else None,
                    quantity=float(row.get('数量', 0)) if pd.notna(row.get('数量')) else None,
                    unit=str(row.get('单位', '')) if pd.notna(row.get('单位')) else None,
                    unit_price_tax=float(row.get('单价（含税）', 0)) if pd.notna(row.get('单价（含税）')) else None,
                    unit_price_no_tax=float(row.get('单价（不含税）', 0)) if pd.notna(row.get('单价（不含税）')) else None,
                    amount_tax=float(row.get('金额（含税）', 0)) if pd.notna(row.get('金额（含税）')) else None,
                    amount_no_tax=float(row.get('金额(RMB)不含税', 0)) if pd.notna(row.get('金额(RMB)不含税')) else None,
                    tax_rate=float(row.get('税点', 0)) if pd.notna(row.get('税点')) else None,
                    week=str(row.get('每周', '')) if pd.notna(row.get('每周')) else None
                )
                db.add(purchase)
                imported += 1
                
            except Exception as e:
                errors.append(f"行{idx+2}: {str(e)}")
        
        db.commit()
        
        return {
            "success": True,
            "imported": imported,
            "errors": errors[:10] if errors else [],
            "total_errors": len(errors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")
    finally:
        if file_path.exists():
            file_path.unlink()


@router.post("/work-hours")
async def upload_work_hours(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """上传工时Excel文件"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="仅支持.xlsx格式")
    
    file_path = UPLOADS_DIR / f"workhours_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        # 读取Excel - 跳过第一行表头
        df = pd.read_excel(file_path, sheet_name='模具内部制作数据支撑表', header=1)
        
        # 清理列名
        df.columns = df.columns.str.strip()
        
        imported = 0
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # 处理日期
                date_val = row.get('日期')
                if pd.isna(date_val):
                    continue
                
                if isinstance(date_val, str):
                    date = pd.to_datetime(date_val).date()
                elif isinstance(date_val, datetime):
                    date = date_val.date()
                else:
                    date = pd.to_datetime(date_val).date()
                
                work_hour = WorkHour(
                    date=date,
                    mold_no=str(row.get('模具编号', '')) if pd.notna(row.get('模具编号')) else None,
                    work_item=str(row.get('工作事项', '')) if pd.notna(row.get('工作事项')) else None,
                    work_content=str(row.get('当日工作内容', '')) if pd.notna(row.get('当日工作内容')) else None,
                    process_qty=int(row.get('加工件数', 0)) if pd.notna(row.get('加工件数')) else None,
                    work_type=str(row.get('工种', '')) if pd.notna(row.get('工种')) else None,
                    subdivision=str(row.get('细分', '')) if pd.notna(row.get('细分')) else None,
                    project=str(row.get('项目', '')) if pd.notna(row.get('项目')) else None,
                    process_category=str(row.get('加工类别', '')) if pd.notna(row.get('加工类别')) else None,
                    operator=str(row.get('操作者', '')) if pd.notna(row.get('操作者')) else None,
                    estimated_hours=float(row.get('预计工时（H）', 0)) if pd.notna(row.get('预计工时（H）')) else None,
                    actual_hours=float(row.get('实际工时（H）', 0)) if pd.notna(row.get('实际工时（H）')) else None,
                    efficiency=float(row.get('效率%', 0)) if pd.notna(row.get('效率%')) else None,
                    unit_price=float(row.get('工价', 0)) if pd.notna(row.get('工价')) else None,
                    amount_tax=float(row.get('含税金额', 0)) if pd.notna(row.get('含税金额')) else None,
                    amount_no_tax=float(row.get('未税金额', 0)) if pd.notna(row.get('未税金额')) else None,
                    week=str(row.get('每周', '')) if pd.notna(row.get('每周')) else None
                )
                db.add(work_hour)
                imported += 1
                
            except Exception as e:
                errors.append(f"行{idx+2}: {str(e)}")
        
        db.commit()
        
        return {
            "success": True,
            "imported": imported,
            "errors": errors[:10] if errors else [],
            "total_errors": len(errors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")
    finally:
        if file_path.exists():
            file_path.unlink()


@router.post("/part-prices")
async def upload_part_prices(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """上传散件标准价Excel文件"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="仅支持.xlsx格式")
    
    file_path = UPLOADS_DIR / f"partprices_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        xlsx = pd.ExcelFile(file_path)
        imported = 0
        
        # 遍历所有散件sheet (10.01-10.40)
        for sheet_name in xlsx.sheet_names:
            if not sheet_name.startswith('10.'):
                continue
            
            try:
                # 读取sheet
                df = pd.read_excel(xlsx, sheet_name=sheet_name, header=None)
                
                # 解析数据 - 根据格式提取信息
                part_code = sheet_name
                part_name = df.iloc[0, 1] if len(df) > 0 else sheet_name
                
                # 遍历三种规格（小/中/大）
                for size_idx, size_type in enumerate(['小型', '中型', '大型']):
                    row_offset = 3 + size_idx * 10  # 每种规格占10行
                    
                    if row_offset >= len(df):
                        continue
                    
                    try:
                        length = float(df.iloc[row_offset, 2]) if len(df.columns) > 2 else None
                        width = float(df.iloc[row_offset, 3]) if len(df.columns) > 3 else None
                        height = float(df.iloc[row_offset, 4]) if len(df.columns) > 4 else None
                    except:
                        length, width, height = None, None, None
                    
                    # 工序费用（简化提取）
                    try:
                        total_cost = float(df.iloc[row_offset + 8, 5]) if len(df.columns) > 5 else 0
                        final_price = float(df.iloc[row_offset + 9, 5]) if len(df.columns) > 5 else 0
                    except:
                        total_cost, final_price = 0, 0
                    
                    part_price = PartPrice(
                        part_code=part_code,
                        part_name=str(part_name),
                        size_type=size_type,
                        length=length,
                        width=width,
                        height=height,
                        total_cost=total_cost,
                        final_price=final_price
                    )
                    db.add(part_price)
                    imported += 1
                    
            except Exception as e:
                continue
        
        db.commit()
        
        return {
            "success": True,
            "imported": imported,
            "message": f"成功导入{imported}条散件标准价"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")
    finally:
        if file_path.exists():
            file_path.unlink()
