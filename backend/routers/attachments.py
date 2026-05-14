"""附件管理API"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import shutil

from models import get_db, Attachment
# BaseResponse not needed

router = APIRouter(prefix="/api/attachments", tags=["附件管理"])

# 附件存储目录
ATTACHMENT_DIR = "/app/mold-factory/uploads/attachments"
THUMBNAIL_DIR = "/app/mold-factory/uploads/attachments/thumbnails"
os.makedirs(ATTACHMENT_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

# 支持的图片类型
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}


# Pydantic 模型
class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    category: Optional[str] = None
    related_type: Optional[str] = None
    related_id: Optional[int] = None
    thumbnail_path: Optional[str] = None
    version: Optional[int] = 1
    upload_user: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AttachmentListResponse(BaseModel):
    items: List[AttachmentResponse]
    total: int


def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return os.path.splitext(filename)[1].lower()


def is_image(filename: str) -> bool:
    """判断是否为图片"""
    return get_file_extension(filename) in IMAGE_EXTENSIONS


def generate_thumbnail(file_path: str, thumbnail_path: str) -> Optional[str]:
    """生成缩略图"""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            # 保持宽高比，缩放到200x200
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            img.save(thumbnail_path, quality=85)
        return thumbnail_path
    except Exception as e:
        print(f"生成缩略图失败: {e}")
        return None


@router.post("/upload", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    category: Optional[str] = Query(None, description="附件分类：公司简介/协议/图纸/报价单"),
    related_type: Optional[str] = Query(None, description="关联类型：supplier/part/mold"),
    related_id: Optional[int] = Query(None, description="关联ID"),
    upload_user: Optional[str] = Query(None, description="上传人"),
    db: Session = Depends(get_db)
):
    """上传附件"""
    # 生成唯一文件名
    ext = get_file_extension(file.filename)
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(ATTACHMENT_DIR, unique_filename)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 获取文件大小
    file_size = os.path.getsize(file_path)
    
    # 生成缩略图（如果是图片）
    thumbnail_path = None
    if is_image(file.filename):
        thumb_filename = f"thumb_{unique_filename}"
        thumbnail_path = os.path.join(THUMBNAIL_DIR, thumb_filename)
        generate_thumbnail(file_path, thumbnail_path)
        thumbnail_path = thumbnail_path.replace("/app/mold-factory/uploads", "/uploads")
    
    # 保存到数据库
    attachment = Attachment(
        file_name=file.filename,
        file_path=file_path.replace("/app/mold-factory/uploads", "/uploads"),
        file_type=get_file_extension(file.filename).lstrip('.'),
        file_size=file_size,
        category=category,
        related_type=related_type,
        related_id=related_id,
        thumbnail_path=thumbnail_path,
        upload_user=upload_user
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return AttachmentResponse.model_validate(attachment)


@router.get("/", response_model=AttachmentListResponse)
def list_attachments(
    related_type: Optional[str] = Query(None, description="关联类型"),
    related_id: Optional[int] = Query(None, description="关联ID"),
    category: Optional[str] = Query(None, description="附件分类"),
    db: Session = Depends(get_db)
):
    """获取附件列表"""
    query = db.query(Attachment)
    
    if related_type:
        query = query.filter(Attachment.related_type == related_type)
    if related_id:
        query = query.filter(Attachment.related_id == related_id)
    if category:
        query = query.filter(Attachment.category == category)
    
    items = query.order_by(Attachment.created_at.desc()).all()
    
    return AttachmentListResponse(
        items=[AttachmentResponse.model_validate(item) for item in items],
        total=len(items)
    )


@router.get("/{attachment_id}", response_model=AttachmentResponse)
def get_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """获取附件详情"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    return AttachmentResponse.model_validate(attachment)


@router.get("/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """下载附件"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    # 转换相对路径为绝对路径
    file_path = attachment.file_path.replace("/uploads", "/app/mold-factory/uploads")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(
        path=file_path,
        filename=attachment.file_name,
        media_type="application/octet-stream"
    )


@router.get("/{attachment_id}/preview")
def preview_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """预览附件（图片直接返回，其他返回下载链接）"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    file_path = attachment.file_path.replace("/uploads", "/app/mold-factory/uploads")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 图片类附件直接返回
    if is_image(attachment.file_name):
        return FileResponse(path=file_path, media_type=f"image/{attachment.file_type}")
    
    # PDF返回iframe预览信息
    if attachment.file_type == 'pdf':
        return {
            "type": "pdf",
            "url": attachment.file_path,
            "file_name": attachment.file_name
        }
    
    # 其他类型返回下载信息
    return {
        "type": "download",
        "url": f"/api/attachments/{attachment_id}/download",
        "file_name": attachment.file_name
    }


@router.delete("/{attachment_id}")
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """删除附件"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    # 删除物理文件
    file_path = attachment.file_path.replace("/uploads", "/app/mold-factory/uploads")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # 删除缩略图
    if attachment.thumbnail_path:
        thumb_path = attachment.thumbnail_path.replace("/uploads", "/app/mold-factory/uploads")
        if os.path.exists(thumb_path):
            os.remove(thumb_path)
    
    db.delete(attachment)
    db.commit()
    
    return {"success": True, "message": "删除成功"}


@router.put("/{attachment_id}", response_model=AttachmentResponse)
def update_attachment(
    attachment_id: int,
    category: Optional[str] = None,
    related_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """更新附件关联信息"""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    if category is not None:
        attachment.category = category
    if related_id is not None:
        attachment.related_id = related_id
    
    db.commit()
    db.refresh(attachment)
    
    return AttachmentResponse.model_validate(attachment)
