"""
Rotas de produtos educacionais:
- Públicas: listar.
- Protegidas (JWT admin): criar, editar, remover.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[schemas.EducationalProductOut])
def list_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@router.post("", response_model=schemas.EducationalProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: schemas.EducationalProductCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.create_product(db, data)


@router.put("/{product_id}", response_model=schemas.EducationalProductOut)
def update_product(
    product_id: int,
    data: schemas.EducationalProductUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto educacional não encontrado")
    return crud.update_product(db, product, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto educacional não encontrado")
    crud.delete_product(db, product)
