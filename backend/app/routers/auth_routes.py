"""
Rota de login do admin. Recebe usuário/senha e devolve um token JWT
que deve ser enviado no header Authorization: Bearer <token> nas rotas
protegidas do CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.auth import authenticate_user, create_access_token, get_current_admin
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )
    token = create_access_token(data={"sub": user.username})
    return schemas.Token(access_token=token)


@router.get("/me")
def me(current_admin=Depends(get_current_admin)):
    return {"username": current_admin.username}
