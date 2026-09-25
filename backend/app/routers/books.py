"""
Rotas de livros:
- Públicas: listar.
- Protegidas (JWT admin): criar, editar, remover, upload de capa.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db
from app.uploads import delete_uploaded_file, save_image_upload

router = APIRouter(prefix="/api/books", tags=["books"])


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

    delete_uploaded_file(book.cover_image)
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

    relative_path = await save_image_upload(file)
    delete_uploaded_file(book.cover_image)
    return crud.set_book_cover(db, book, relative_path)


@router.delete("/{book_id}/cover", response_model=schemas.BookOut)
def delete_book_cover(
    book_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    book = crud.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Livro não encontrado")

    delete_uploaded_file(book.cover_image)
    return crud.set_book_cover(db, book, None)
