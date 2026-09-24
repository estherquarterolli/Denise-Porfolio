"""
Script de inicialização do banco de dados.

O que ele faz:
1. Cria as tabelas (caso ainda não existam).
2. Cria o usuário admin definido em ADMIN_USERNAME / ADMIN_PASSWORD no .env
   (se ele ainda não existir).
3. Semeia 2 projetos de exemplo com dados reais retirados do Currículo Lattes
   da Denise, só para o site não começar vazio — edite/apague pelo painel
   /admin depois.

Uso:
    python init_db.py
"""
from app.database import Base, engine, SessionLocal
from app.config import settings
from app import models, crud
from app.auth import hash_password


def create_admin_if_missing(db):
    existing = db.query(models.AdminUser).filter(
        models.AdminUser.username == settings.ADMIN_USERNAME
    ).first()
    if existing:
        print(f"Usuário admin '{settings.ADMIN_USERNAME}' já existe — pulando.")
        return
    admin = models.AdminUser(
        username=settings.ADMIN_USERNAME,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
    )
    db.add(admin)
    db.commit()
    print(f"Usuário admin '{settings.ADMIN_USERNAME}' criado com sucesso.")


SEED_PROJECTS = [
    {
        "title": "Determinantes socioambientais das infecções respiratórias na infância",
        "description": (
            "Estudo observacional (abordagem mista) que investiga a associação entre "
            "condições habitacionais inadequadas — umidade, mofo, ventilação insuficiente, "
            "superlotação — e a recorrência de infecções respiratórias em crianças atendidas "
            "na Atenção Primária à Saúde, em territórios vulneráveis. Coleta de dados via "
            "prontuários eletrônicos (e-SUS), registros de visitas domiciliares e entrevistas "
            "semiestruturadas com profissionais de saúde."
        ),
        "category": "Pesquisa",
        "tech_stack": "Epidemiologia Social,Saúde Infantil,Determinantes Sociais da Saúde",
        "project_date": "2026 - Atual",
        "status": models.ProjectStatus.EM_ANDAMENTO,
        "featured": True,
    },
    {
        "title": "Determinantes sociais da saúde infantil em creches públicas",
        "description": (
            "Projeto de pesquisa que analisa as condições de saúde de crianças matriculadas "
            "em creche pública municipal, com foco nas doenças mais recorrentes, no estado "
            "vacinal e nas percepções familiares sobre saúde, propondo estratégias para "
            "mitigar a recorrência dessas condições associadas à vulnerabilidade socioeconômica."
        ),
        "category": "Pesquisa",
        "tech_stack": "Saúde Pública,Educação Infantil,Vulnerabilidade Social",
        "project_date": "2025 - Atual",
        "status": models.ProjectStatus.EM_ANDAMENTO,
        "featured": False,
    },
]


def seed_projects_if_empty(db):
    if db.query(models.Project).count() > 0:
        print("Já existem projetos cadastrados — pulando seed.")
        return
    for item in SEED_PROJECTS:
        slug = crud.make_unique_slug(db, item["title"])
        project = models.Project(**item, slug=slug)
        db.add(project)
    db.commit()
    print(f"{len(SEED_PROJECTS)} projeto(s) de exemplo criado(s).")


def main():
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        create_admin_if_missing(db)
        seed_projects_if_empty(db)
    finally:
        db.close()

    print("Inicialização concluída.")


if __name__ == "__main__":
    main()
