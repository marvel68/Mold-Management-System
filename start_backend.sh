#!/bin/bash
cd /app/mold-factory/backend
source /app/mold-factory/venv/bin/activate 2>/dev/null || true
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
