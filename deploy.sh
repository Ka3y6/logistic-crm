#!/usr/bin/env bash
# Автоматический деплой проекта logistic-crm
# Выполняет: git pull, обновление Python + JS зависимостей, миграции, build React,
# перезапуск Gunicorn и Nginx.

set -euo pipefail

PROJECT_ROOT="/opt/logistic-crm"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$BACKEND_DIR/venv"

echo "📥 Pulling latest code..."
/usr/bin/git -C "$PROJECT_ROOT" pull origin main

# ----------------------------
# Django backend
# ----------------------------

echo "🐍 Updating Python dependencies..."
source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip
python -m pip install -r "$BACKEND_DIR/requirements.txt"

echo "🗄 Running Django migrations..."
python "$BACKEND_DIR/manage.py" migrate --noinput

echo "🎁 Collecting static files..."
python "$BACKEND_DIR/manage.py" collectstatic --noinput

deactivate

# ----------------------------
# React frontend
# ----------------------------

echo "📦 Building React frontend (8 ГБ RAM)..."
cd "$FRONTEND_DIR"
export NODE_OPTIONS="--max_old_space_size=8192"
/usr/bin/npm ci --silent
/usr/bin/npm run build

# ----------------------------
# Restart services
# ----------------------------

echo "🚀 Restarting Gunicorn & reloading Nginx..."
/usr/bin/systemctl restart gunicorn
/usr/bin/systemctl reload nginx

echo "✅ Deploy complete $(date)" 