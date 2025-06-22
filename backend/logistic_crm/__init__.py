from pathlib import Path
from dotenv import load_dotenv, find_dotenv
import os

# Автоматически ищем .env начиная от текущей папки вверх
dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)
else:
    # Попробуем искать .env в корне backend
    backend_root = Path(__file__).resolve().parent.parent
    potential = backend_root / '.env'
    if potential.exists():
        load_dotenv(potential)

# Теперь переменные окружения (.env) доступны ранним импортам, включая settings.py 