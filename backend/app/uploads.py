"""Helpers de upload de imagem compartilhados pelas rotas do admin.

A extensão do arquivo salvo vem do Content-Type validado (nunca do nome
enviado pelo cliente), para que um upload não possa forçar uma extensão
arbitrária (ex.: .html) que o navegador interprete como algo executável.
"""
import os
import uuid

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


async def save_image_upload(file: UploadFile, prefix: str = "") -> str:
    """Valida, lê e grava um upload de imagem. Retorna o caminho público relativo."""
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo maior que {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{prefix}{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as destination:
        destination.write(contents)

    return f"/{settings.UPLOAD_DIR}/{filename}"


def delete_uploaded_file(relative_path: str | None) -> None:
    """Remove um arquivo de uploads/ a partir do caminho público salvo no banco."""
    if not relative_path or not relative_path.startswith(f"/{settings.UPLOAD_DIR}/"):
        return
    path = os.path.join(settings.UPLOAD_DIR, os.path.basename(relative_path))
    if os.path.exists(path):
        os.remove(path)
