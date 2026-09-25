"""Conteúdo editável da trajetória acadêmica e profissional."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/api/career", tags=["career"])

DEFAULT_TIMELINE = [
    {"year": "1994–1998", "title": "Magistério", "detail": "Curso técnico na Escola Estadual René de Oliveira Barbosa.", "order": 0},
    {"year": "2003–2006", "title": "Graduação em Pedagogia", "detail": "Universidade Estácio de Sá.", "order": 1},
    {"year": "2008–2011", "title": "Duas especializações", "detail": "Psicomotricidade aplicada à Educação e Gestão Escolar Integrada — Faculdades Integradas de Jacarepaguá.", "order": 2},
    {"year": "2016–2017", "title": "Mestrado Profissional", "detail": "Ensino de Ciências — Instituto Federal do Rio de Janeiro (IFRJ).", "order": 3},
    {"year": "2018–2023", "title": "Doutorado", "detail": "Educação em Ciências e Saúde — Universidade Federal do Rio de Janeiro (UFRJ).", "order": 4},
    {"year": "2025–2026", "title": "Especialização em Docência na Educação Infantil", "detail": "Universidade Federal Rural do Rio de Janeiro (UFRRJ).", "order": 5},
]

DEFAULT_HIGHLIGHTS = []


def serialize_content(timeline, highlights):
    legacy_titles = {"Pedagogia", "Mestrado", "Doutorado", "Especialização"}
    stored_titles = {item.title for item in timeline}
    is_legacy_summary = len(timeline) == 4 and stored_titles == legacy_titles
    if (not timeline and not highlights) or is_legacy_summary:
        return {"timeline": DEFAULT_TIMELINE, "highlights": DEFAULT_HIGHLIGHTS}
    return {"timeline": timeline, "highlights": highlights}


@router.get("", response_model=schemas.CareerContentOut)
def get_career_content(db: Session = Depends(get_db)):
    timeline, highlights = crud.get_career_content(db)
    return serialize_content(timeline, highlights)


@router.put("", response_model=schemas.CareerContentOut)
def update_career_content(
    data: schemas.CareerContentUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    timeline, highlights = crud.replace_career_content(db, data)
    return {"timeline": timeline, "highlights": highlights}
