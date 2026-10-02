"""
Rota de login do admin. Recebe usuário/senha e devolve um token JWT
que deve ser enviado no header Authorization: Bearer <token> nas rotas
protegidas do CRUD.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import schemas
from app.auth import authenticate_user, create_access_token, get_current_admin, hash_password, verify_password
from app.database import get_db
from app.rate_limit import rate_limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])

# No máximo 5 tentativas de login a cada 5 minutos por IP (prevenção contra brute force)
login_rate_limit = rate_limiter(max_requests=5, window_seconds=300, scope="auth:login")
change_password_rate_limit = rate_limiter(max_requests=5, window_seconds=300, scope="auth:change-password")


@router.post("/login", response_model=schemas.Token, dependencies=[Depends(login_rate_limit)])
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


@router.post("/change-password", dependencies=[Depends(change_password_rate_limit)])
def change_password(
    payload: schemas.ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if not verify_password(payload.current_password, current_admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha atual informada está incorreta.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ser diferente da senha atual.",
        )
    current_admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Senha alterada com sucesso!"}
