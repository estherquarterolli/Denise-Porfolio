"""
Ponto de entrada da API. Sobe o FastAPI, registra as rotas, libera CORS
para o frontend e serve os arquivos estáticos (frontend + uploads).

Rodar em desenvolvimento:
    uvicorn app.main:app --reload
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth_routes, projects, contact, books

# Cria as tabelas automaticamente caso ainda não existam
# (para produção, prefira migrações com Alembic).
Base.metadata.create_all(bind=engine)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="API do Portfólio — Denise Ana Augusta dos Santos Oliveira",
    description="API para gerenciar os projetos exibidos no site portfólio.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas da API
app.include_router(auth_routes.router)
app.include_router(projects.router)
app.include_router(books.router)
app.include_router(contact.router)

@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


# Arquivos de imagem enviados pelo admin
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Frontend estático (site público + painel admin) — precisa ser o último mount,
# pois StaticFiles("/") intercepta qualquer rota registrada depois dele.
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
