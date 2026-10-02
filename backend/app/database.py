"""
Configuração da engine SQLAlchemy e da sessão do banco de dados (PostgreSQL).
"""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


CONTENT_COLUMNS = {
    "books": {
        "tag": "VARCHAR(80)",
        "order": "INTEGER DEFAULT 0",
    },
    "projects": {
        "order": "INTEGER DEFAULT 0",
    },
    "publications": {
        "order": "INTEGER DEFAULT 0",
    },
    "educational_products": {
        "image_path": "VARCHAR(500)",
        "tag": "VARCHAR(80)",
        "order": "INTEGER DEFAULT 0",
    },
}


def ensure_content_columns() -> None:
    """Adiciona campos novos em bancos existentes sem apagar conteúdo."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    for table_name, columns in CONTENT_COLUMNS.items():
        if table_name not in existing_tables:
            continue
        existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, column_type in columns.items():
            if column_name in existing_columns:
                continue
            try:
                with engine.begin() as connection:
                    connection.execute(text(
                        f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {column_type}'
                    ))
            except SQLAlchemyError:
                # Outro worker pode ter aplicado a mesma alteração ao iniciar.
                refreshed = {column["name"] for column in inspect(engine).get_columns(table_name)}
                if column_name not in refreshed:
                    raise


def get_db():
    """Dependency do FastAPI: entrega uma sessão de banco e garante que feche no final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
