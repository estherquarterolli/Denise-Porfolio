"""
Rota pública do formulário de contato e rota protegida para a Denise
ver as mensagens recebidas no admin.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import schemas, models
from app.auth import get_current_admin
from app.database import get_db
from app.email_utils import send_contact_email

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=schemas.ContactOut, status_code=status.HTTP_201_CREATED)
def send_contact_message(data: schemas.ContactCreate, db: Session = Depends(get_db)):
    email_sent = send_contact_email(data.name, data.email, data.message)

    message = models.ContactMessage(
        name=data.name,
        email=data.email,
        message=data.message,
        email_sent=email_sent,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("", response_model=List[schemas.ContactOut])
def list_contact_messages(
    db: Session = Depends(get_db), current_admin=Depends(get_current_admin)
):
    return (
        db.query(models.ContactMessage)
        .order_by(models.ContactMessage.created_at.desc())
        .all()
    )
