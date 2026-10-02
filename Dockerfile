FROM python:3.11-slim

# Evita geração de bytecode .pyc e faz flush imediato nos logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instala curl para checagens de saúde (healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências do Python
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copia backend e frontend
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Cria pasta de uploads persistentes
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

EXPOSE 8000

# Executa migrações/seed inicial idempotente e sobe o Uvicorn
CMD ["sh", "-c", "python init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
