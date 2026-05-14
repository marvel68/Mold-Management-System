# 模具厂管理系统

传统模具厂Web管理系统，支持采购管理、工时管理、散件标准价查询、AI预测等功能。

## 功能特性

- **采购管理**：采购订单录入、查询、统计
- **工时管理**：员工工时记录、效率统计
- **散件标准价**：标准件价格查询
- **周透视**：按周统计采购数据
- **供应商管理**：供应商信息管理
- **模具管理**：模具信息管理
- **AI预测**：智能预测分析
- **附件管理**：支持图片、PDF等附件上传
- **数据导入**：支持Excel批量导入

## 技术栈

- **后端**：FastAPI + SQLAlchemy + SQLite
- **前端**：React + Vite + Ant Design
- **数据库**：SQLite（轻量级，便于部署）

## 系统要求

- Python 3.10+
- Node.js 18+
- Windows 7+ 或 Linux/macOS

## 快速开始

### Windows

1. 首次运行前，先双击 `install.bat` 安装依赖
2. 双击 `start.bat` 启动系统
3. 访问 http://localhost:3001

### Linux/macOS

```bash
# 首次运行
chmod +x install.sh && ./install.sh

# 启动系统
chmod +x start.sh && ./start.sh
```

或者手动启动：

```bash
# 安装后端依赖
cd backend && pip install -r requirements.txt && cd ..

# 安装前端依赖
cd frontend && npm install && cd ..

# 创建目录
mkdir -p data uploads/attachments/thumbnails

# 启动后端（端口8011）
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8011 &

# 启动前端（端口3001）
cd frontend && npx vite --host 0.0.0.0 --port 3001
```

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 3001 | Web界面 |
| 后端 | 8011 | API服务 |
| API文档 | 8011/docs | Swagger文档 |

## 目录结构

```
mold-factory/
├── backend/            # 后端代码
│   ├── config.py      # 配置文件
│   ├── main.py        # 主程序
│   ├── models/        # 数据模型
│   ├── routers/       # API路由
│   └── requirements.txt
├── frontend/          # 前端代码
│   ├── src/          # React代码
│   └── package.json
├── data/              # 数据库目录
├── uploads/           # 上传文件目录
│   └── attachments/   # 附件存储
│       └── thumbnails/# 缩略图
├── start.bat          # Windows启动脚本
├── stop.bat           # Windows停止脚本
├── install.bat        # Windows安装脚本
├── start.sh           # Linux启动脚本
├── stop.sh            # Linux停止脚本
└── README.md
```

## API文档

启动后访问：http://localhost:8011/docs

## 数据库

数据库文件位于 `data/mold_factory.db`，使用SQLite存储。

## 常见问题

### 1. 端口被占用

如果8011或3001端口被占用，可修改启动脚本中的端口号。

### 2. 前端无法访问后端API

检查后端是否正常启动，确认前端API地址配置正确。

### 3. 图片上传失败

确保 `uploads/attachments` 目录存在且有写入权限。

## 许可证

MIT License
