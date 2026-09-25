"""
Configurações centrais da aplicação, carregadas do arquivo .env.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Banco de dados
    DATABASE_URL: str = "postgresql+psycopg2://usuario:senha@localhost:5432/denise_portfolio"

    # JWT
    SECRET_KEY: str = "troque-esta-chave"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Admin inicial
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"

    # Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    # E-mail
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    CONTACT_RECEIVER_EMAIL: str = ""

    # CORS — aceita uma ou mais origens separadas por vírgula
    # (ex.: "https://denisesite.com,https://www.denisesite.com")
    FRONTEND_ORIGIN: str = "http://localhost:8000"

    # "production" desliga /docs, /redoc e /openapi.json e restringe o CORS
    # às origens configuradas acima (sem os localhost de desenvolvimento).
    ENVIRONMENT: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]
        if self.ENVIRONMENT != "production":
            origins += ["http://localhost:8000", "http://127.0.0.1:8000"]
        return origins

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
