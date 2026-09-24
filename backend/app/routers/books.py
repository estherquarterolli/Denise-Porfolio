"""
Rotas de livros:
- Públicas: listar.
- Protegidas (JWT admin): criar, editar, remover, upload de capa.
"""
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.config import settings
from app.database import get_db

router = APIRouter(prefix="/api/books", tags=["books"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# ---------- Rotas públicas ----------

@router.get("", response_model=List[schemas.BookOut])
def list_books(db: Session = Depends(get_db)):
    return crud.get_books(db)


@router.get("/{book_id}", response_model=schemas.BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    return book


# ---------- Rotas protegidas (admin) ----------

@router.post("", response_model=schemas.BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    data: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.create_book(db, data)


@router.put("/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: int,
    data: schemas.BookUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")
    return crud.update_book(db, book, data)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")

    if book.cover_image:
        path = os.path.join(settings.UPLOAD_DIR, os.path.basename(book.cover_image))
        if os.path.exists(path):
            os.remove(path)

    crud.delete_book(db, book)


@router.post("/{book_id}/cover", response_model=schemas.BookOut)
async def upload_book_cover(
    book_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não permitido")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo maior que {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    if book.cover_image:
        old_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(book.cover_image))
        if os.path.exists(old_path):
            os.remove(old_path)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    relative_path = f"/{settings.UPLOAD_DIR}/{filename}"
    return crud.set_book_cover(db, book, relative_path)
