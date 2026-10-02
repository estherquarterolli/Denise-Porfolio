"""
Rotas de publicações:
- Públicas: listar.
- Protegidas (JWT admin): criar, editar, remover.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/api/publications", tags=["publications"])


@router.get("", response_model=List[schemas.PublicationOut])
def list_publications(db: Session = Depends(get_db)):
    return crud.get_publications(db)


@router.post("", response_model=schemas.PublicationOut, status_code=status.HTTP_201_CREATED)
def create_publication(
    data: schemas.PublicationCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.create_publication(db, data)


@router.put("/reorder", response_model=List[schemas.PublicationOut])
def reorder_publications(
    items: List[schemas.ItemOrderUpdate],
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.reorder_publications(db, items)


@router.put("/{publication_id}", response_model=schemas.PublicationOut)
def update_publication(
    publication_id: int,
    data: schemas.PublicationUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    publication = crud.get_publication(db, publication_id)
    if not publication:
        raise HTTPException(status_code=404, detail="Publicação não encontrada")
    return crud.update_publication(db, publication, data)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(
    publication_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    publication = crud.get_publication(db, publication_id)
    if not publication:
        raise HTTPException(status_code=404, detail="Publicação não encontrada")
    crud.delete_publication(db, publication)
