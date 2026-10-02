"""
Ponto de entrada da API. Sobe o FastAPI, registra as rotas, libera CORS
para o frontend e serve os arquivos estáticos (frontend + uploads).

Rodar em desenvolvimento:
    uvicorn app.main:app --reload
"""
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine, ensure_content_columns
from app.routers import about, auth_routes, projects, contact, books, publications, products, career

# Cria as tabelas automaticamente caso ainda não existam
# (para produção, prefira migrações com Alembic).
Base.metadata.create_all(bind=engine)
ensure_content_columns()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="API do Portfólio — Denise Ana Augusta dos Santos Oliveira",
    description="API para gerenciar os projetos exibidos no site portfólio.",
    version="1.0.0",
    # Em produção o Swagger/ReDoc ficam desligados — a API é de uso interno do
    # próprio site, não precisa de documentação interativa pública.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        # Content Security Policy: restringe origens de scripts, estilos, fontes e frames
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net data:; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https://cloudflareinsights.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self';"
        )
    return response

# Rotas da API
app.include_router(auth_routes.router)
app.include_router(projects.router)
app.include_router(books.router)
app.include_router(publications.router)
app.include_router(products.router)
app.include_router(about.router)
app.include_router(career.router)
app.include_router(contact.router)

@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


@app.get("/admin", include_in_schema=False)
def admin_redirect():
    return RedirectResponse(url="/admin.html", status_code=307)


# Arquivos de imagem enviados pelo admin
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Frontend estático (site público + painel admin) — precisa ser o último mount,
# pois StaticFiles("/") intercepta qualquer rota registrada depois dele.
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
