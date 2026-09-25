"""Galeria editável exibida na seção Sobre mim."""
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db
from app.uploads import delete_uploaded_file, save_image_upload

router = APIRouter(prefix="/api/about-images", tags=["about-images"])


@router.get("", response_model=List[schemas.AboutImageOut])
def list_about_images(db: Session = Depends(get_db)):
    return crud.get_about_images(db)


@router.post("", response_model=schemas.AboutImageOut, status_code=status.HTTP_201_CREATED)
async def upload_about_image(
    file: UploadFile = File(...),
    caption: str = Form(""),
    alt_text: str = Form(""),
    order: int = Form(0),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    relative_path = await save_image_upload(file, prefix="about-")
    return crud.add_about_image(db, relative_path, caption, alt_text, order)


@router.put("/reorder", response_model=List[schemas.AboutImageOut])
def reorder_about_images(
    items: List[schemas.AboutImageOrderUpdate],
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.reorder_about_images(db, items)


@router.put("/{image_id}", response_model=schemas.AboutImageOut)
def update_about_image(
    image_id: int,
    data: schemas.AboutImageUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    image = crud.get_about_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    return crud.update_about_image(db, image, data)


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_about_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    image = crud.get_about_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    delete_uploaded_file(image.image_path)
    crud.delete_about_image(db, image)
