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
    tag: Optional[str] = Field(default=None, max_length=80)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    year: Optional[str] = None
    publisher: Optional[str] = None
    external_url: Optional[str] = None
    tag: Optional[str] = Field(default=None, max_length=80)


class BookOut(BookBase):
    id: int
    cover_image: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Publicações ----------

class PublicationBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    kicker: Optional[str] = None
    category: Optional[str] = None
    external_url: Optional[str] = None
    featured: bool = False
    order: int = 0


class PublicationCreate(PublicationBase):
    pass


class PublicationUpdate(BaseModel):
    title: Optional[str] = None
    kicker: Optional[str] = None
    category: Optional[str] = None
    external_url: Optional[str] = None
    featured: Optional[bool] = None
    order: Optional[int] = None


class PublicationOut(PublicationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Produtos educacionais ----------

class EducationalProductBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=300)
    kicker: Optional[str] = None
    category: Optional[str] = None
    external_url: Optional[str] = None
    tag: Optional[str] = Field(default=None, max_length=80)
    order: int = 0


class EducationalProductCreate(EducationalProductBase):
    pass


class EducationalProductUpdate(BaseModel):
    title: Optional[str] = None
    kicker: Optional[str] = None
    category: Optional[str] = None
    external_url: Optional[str] = None
    tag: Optional[str] = Field(default=None, max_length=80)
    order: Optional[int] = None


class EducationalProductOut(EducationalProductBase):
    id: int
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- Imagens da seção Sobre mim ----------

class AboutImageUpdate(BaseModel):
    caption: Optional[str] = Field(default=None, max_length=250)
    alt_text: Optional[str] = Field(default=None, max_length=250)
    order: Optional[int] = Field(default=None, ge=0)


class AboutImageOut(BaseModel):
    id: int
    image_path: str
    caption: Optional[str] = None
    alt_text: Optional[str] = None
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AboutImageOrderUpdate(BaseModel):
    id: int
    order: int = Field(..., ge=0)


# ---------- Trajetória acadêmica e profissional ----------

class CareerTimelineItemBase(BaseModel):
    year: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=2, max_length=160)
    detail: str = Field(..., min_length=2, max_length=300)
    order: int = Field(default=0, ge=0)


class CareerTimelineItemOut(CareerTimelineItemBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class CareerHighlightBase(BaseModel):
    label: str = Field(..., min_length=2, max_length=160)
    text: str = Field(..., min_length=2, max_length=500)
    order: int = Field(default=0, ge=0)


class CareerHighlightOut(CareerHighlightBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class CareerContentUpdate(BaseModel):
    timeline: List[CareerTimelineItemBase]
    highlights: List[CareerHighlightBase]


class CareerContentOut(BaseModel):
    timeline: List[CareerTimelineItemOut]
    highlights: List[CareerHighlightOut]


# ---------- Autenticação ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


# ---------- Contato ----------

class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    message: str = Field(..., min_length=5, max_length=5000)
    website: Optional[str] = Field(default=None, max_length=100)


class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime
    email_sent: bool

    model_config = ConfigDict(from_attributes=True)
