"""
项目路径配置 - 支持 Windows 和 Linux 跨平台
"""
from pathlib import Path

# 项目根目录（backend的上级目录）
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

# 数据目录
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# 上传目录
UPLOADS_DIR = PROJECT_ROOT / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# 附件存储目录
ATTACHMENT_DIR = UPLOADS_DIR / "attachments"
ATTACHMENT_DIR.mkdir(parents=True, exist_ok=True)

# 缩略图目录
THUMBNAIL_DIR = ATTACHMENT_DIR / "thumbnails"
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)

# 数据库路径
DB_PATH = DATA_DIR / "mold_factory.db"

# 数据库连接URL（兼容Windows和Linux）
# Windows: sqlite:///D:\project\data\db.sqlite
# Linux: sqlite:////home/user/project/data/db.sqlite
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

# 静态文件URL前缀（用于API返回的路径）
UPLOADS_URL_PREFIX = "/uploads"

# 附件的相对路径（存储在数据库中）
def get_attachment_relative_path(filename: str) -> str:
    """获取附件的相对路径（用于数据库存储）"""
    return f"{UPLOADS_URL_PREFIX}/attachments/{filename}"

def get_thumbnail_relative_path(filename: str) -> str:
    """获取缩略图的相对路径（用于数据库存储）"""
    return f"{UPLOADS_URL_PREFIX}/attachments/thumbnails/{filename}"

def resolve_upload_path(relative_path: str) -> Path:
    """将相对路径转换为绝对路径"""
    # 去掉开头的 /uploads/
    if relative_path.startswith(UPLOADS_URL_PREFIX):
        relative_path = relative_path[len(UPLOADS_URL_PREFIX):].lstrip('/')
    return UPLOADS_DIR / relative_path
