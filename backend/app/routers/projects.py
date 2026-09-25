"""
Rotas de projetos:
- Públicas: listar, buscar/filtrar, ver detalhe, listar categorias.
- Protegidas (JWT admin): criar, editar, remover, upload/remoção de imagens.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db
from app.uploads import delete_uploaded_file, save_image_upload

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ---------- Rotas públicas ----------

@router.get("", response_model=List[schemas.ProjectOut])
def list_projects(
    category: Optional[str] = None,
    tech: Optional[str] = None,
    q: Optional[str] = Query(None, description="Busca por título ou descrição"),
    featured: bool = False,
    db: Session = Depends(get_db),
):
    return crud.get_projects(db, category=category, tech=tech, q=q, featured_only=featured)


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    return crud.get_distinct_categories(db)


@router.get("/slug/{slug}", response_model=schemas.ProjectOut)
def get_project_by_slug(slug: str, db: Session = Depends(get_db)):
    project = crud.get_project_by_slug(db, slug)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return project


# ---------- Rotas protegidas (admin) ----------

@router.post("", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return crud.create_project(db, data)


@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    data: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return crud.update_project(db, project, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    # Remove os arquivos de imagem do disco também
    for image in project.images:
        delete_uploaded_file(image.image_path)

    crud.delete_project(db, project)


@router.post(
    "/{project_id}/images",
    response_model=schemas.ProjectImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_project_image(
    project_id: int,
    order: int = 0,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    project = crud.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    relative_path = await save_image_upload(file)
    return crud.add_project_image(db, project_id, relative_path, order)


@router.delete("/{project_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_image(
    project_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    image = crud.get_project_image(db, image_id)
    if not image or image.project_id != project_id:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    delete_uploaded_file(image.image_path)
    crud.delete_project_image(db, image)
