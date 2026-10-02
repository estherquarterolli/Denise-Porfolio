"""
Rota pública do formulário de contato e rota protegida para a Denise
ver as mensagens recebidas no admin.
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db
from app.email_utils import send_contact_email
from app.rate_limit import rate_limiter

router = APIRouter(prefix="/api/contact", tags=["contact"])

# No máximo 3 mensagens a cada 10 minutos por IP, para conter spam automatizado.
contact_rate_limit = rate_limiter(max_requests=3, window_seconds=600, scope="contact:send")


@router.post(
    "",
    response_model=schemas.ContactOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(contact_rate_limit)],
)
def send_contact_message(data: schemas.ContactCreate, db: Session = Depends(get_db)):
    # Proteção Honeypot: Se o campo 'website' foi preenchido, é um bot automatizado
    if data.website and data.website.strip():
        # Descarta silenciosamente sem salvar e sem disparar e-mail
        return schemas.ContactOut(
            id=0,
            name=data.name,
            email=data.email,
            message="[spam]",
            created_at=datetime.utcnow(),
            email_sent=False,
        )

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
