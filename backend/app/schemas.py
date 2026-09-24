"""
Schemas Pydantic usados para validar entrada/saída da API.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models import ProjectStatus


# ---------- Imagens ----------

class ProjectImageOut(BaseModel):
    id: int
    image_path: str
    order: int

    model_config = ConfigDict(from_attributes=True)


# ---------- Projetos ----------

class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=2)
    category: Optional[str] = None
    tech_stack: Optional[str] = ""  # ex: "Python,FastAPI,GSAP"
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    project_date: Optional[str] = None
    status: ProjectStatus = ProjectStatus.EM_ANDAMENTO
    featured: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tech_stack: Optional[str] = None
    repo_url: Optional[str] = None
    demo_url: Optional[str] = None
    project_date: Optional[str] = None
    status: Optional[ProjectStatus] = None
    featured: Optional[bool] = None


class ProjectOut(ProjectBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime
    images: List[ProjectImageOut] = []

    model_config = ConfigDict(from_attributes=True)


# ---------- Livros ----------

class BookBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=2)
    year: Optional[str] = None
    publisher: Optional[str] = None
    external_url: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    year: Optional[str] = None
    publisher: Optional[str] = None
    external_url: Optional[str] = None


class BookOut(BookBase):
    id: int
    cover_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Autenticação ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# ---------- Contato ----------

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    message: str = Field(..., min_length=5)


class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime
    email_sent: bool

    model_config = ConfigDict(from_attributes=True)
