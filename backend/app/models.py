"""
Modelos SQLAlchemy: Projeto, ImagemDoProjeto, UsuárioAdmin e MensagemDeContato.
"""
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ProjectStatus(str, enum.Enum):
    EM_ANDAMENTO = "em_andamento"
    CONCLUIDO = "concluido"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(220), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True, index=True)
    # tecnologias/tags armazenadas como string separada por vírgula, ex: "Python,FastAPI,GSAP"
    tech_stack = Column(String(500), nullable=True, default="")
    repo_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    project_date = Column(String(50), nullable=True)  # texto livre, ex: "2025 - Atual"
    status = Column(SAEnum(ProjectStatus), nullable=False, default=ProjectStatus.EM_ANDAMENTO)
    featured = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = relationship(
        "ProjectImage",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="ProjectImage.order",
    )

    @property
    def tech_list(self):
        if not self.tech_stack:
            return []
        return [t.strip() for t in self.tech_stack.split(",") if t.strip()]


class ProjectImage(Base):
    __tablename__ = "project_images"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)  # caminho relativo, ex: uploads/xyz.jpg
    order = Column(Integer, default=0)

    project = relationship("Project", back_populates="images")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    year = Column(String(50), nullable=True)  # texto livre, ex: "2017" ou "2025 (2ª ed.)"
    publisher = Column(String(200), nullable=True)
    cover_image = Column(String(500), nullable=True)
    external_url = Column(String(500), nullable=True)  # link para leitura/aquisição

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    email_sent = Column(Boolean, default=False)
