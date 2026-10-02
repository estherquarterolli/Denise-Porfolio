"""
Script de inicialização do banco de dados.

O que ele faz:
1. Cria as tabelas (caso ainda não existam).
2. Cria o usuário admin definido em ADMIN_USERNAME / ADMIN_PASSWORD no .env
   (se ele ainda não existir).
3. Semeia o conteúdo inicial de projetos, livros e imagens da seção Sobre.

Uso:
    python init_db.py
"""
from app.database import Base, engine, SessionLocal, ensure_content_columns
from app.config import settings
from app import models, crud
from app.auth import hash_password
from app.routers.career import DEFAULT_HIGHLIGHTS, DEFAULT_TIMELINE


def ensure_database_exists():
    """Se for PostgreSQL e o banco especificado não existir, tenta criá-lo automaticamente."""
    from sqlalchemy.engine.url import make_url

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    url = make_url(db_url)
    if not url.drivername.startswith("postgresql"):
        return

    db_name = url.database
    if not db_name or db_name in ("postgres", "template1"):
        return

    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        return

    # Testa se já consegue conectar no banco de destino
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=url.username,
            password=url.password,
            host=url.host or "localhost",
            port=url.port or 5432,
            connect_timeout=5,
        )
        conn.close()
        return
    except psycopg2.OperationalError as exc:
        if "does not exist" not in str(exc):
            return

    # Tenta conectar no banco padrão 'postgres' para criar o banco de destino
    print(f"Banco de dados '{db_name}' não encontrado no PostgreSQL. Tentando criar automaticamente...")
    try:
        admin_conn = psycopg2.connect(
            dbname="postgres",
            user=url.username,
            password=url.password,
            host=url.host or "localhost",
            port=url.port or 5432,
            connect_timeout=5,
        )
        admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        with admin_conn.cursor() as cur:
            cur.execute(f'CREATE DATABASE "{db_name}"')
        admin_conn.close()
        print(f"Banco de dados '{db_name}' criado com sucesso!")
    except Exception as create_exc:
        print(
            f"Aviso: Não foi possível criar o banco '{db_name}' automaticamente: {create_exc}\n"
            f"Caso a inicialização falhe, crie-o manualmente no PostgreSQL com: CREATE DATABASE \"{db_name}\";"
        )


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

SEED_BOOKS = [
    {
        "title": "Jogue Sementes",
        "description": (
            "Uma história sobre crianças, território, plantio e transformação coletiva. "
            "O gesto de semear abre conversas sobre natureza, participação e esperança."
        ),
        "year": "2025",
        "publisher": "Mar Editora",
        "cover_image": "/img/joge-sementes-emoldurada-capa.png",
        "external_url": "https://www.mareditora.com/product-page/jogue-sementes",
    }
]

SEED_ABOUT_IMAGES = [
    {
        "image_path": "/img/sobre-mim/d4.png",
        "caption": "Educação que floresce",
        "alt_text": "Denise Ana Oliveira diante de um jardim vertical",
        "order": 0,
    },
    {
        "image_path": "/img/sobre-mim/d3.png",
        "caption": "Cultura, território e encontros",
        "alt_text": "Denise ao lado de uma artista em uma atividade cultural",
        "order": 1,
    },
    {
        "image_path": "/img/sobre-mim/d5.png",
        "caption": "Entre leituras e ideias",
        "alt_text": "Retrato de Denise Ana Oliveira com uma xícara nas mãos",
        "order": 2,
    },
    {
        "image_path": "/img/sobre-mim/autografo.jpeg",
        "caption": "Lançamento de Jogue Sementes",
        "alt_text": "Denise autografando o livro Jogue Sementes",
        "order": 3,
    },
    {
        "image_path": "/img/sobre-mim/palco.jpeg",
        "caption": "Educação, pesquisa e troca de saberes",
        "alt_text": "Denise falando ao microfone em um evento acadêmico",
        "order": 4,
    },
    {
        "image_path": "/img/sobre-mim/retrato.jpeg",
        "caption": "Denise Ana Oliveira",
        "alt_text": "Retrato de Denise Ana Oliveira com blazer rosa",
        "order": 5,
    },
]


SEED_PUBLICATIONS = [
    {"title": "Textos de divulgação científica para crianças: potencialidades pedagógicas, mediações docentes e lacunas em saúde", "kicker": "2026 · Divulgação científica · Saúde", "category": "Divulgação científica", "external_url": "https://doi.org/10.21439/2965-6753.v7.e2026002", "featured": True, "order": 0},
    {"title": "Concepções de limpo e sujo para crianças da pré-escola", "kicker": "Educação Infantil · Saúde", "category": "Educação Infantil", "external_url": "https://www.revistacenarios.com/_files/ugd/3ef850_3791d974df6e4ca2815a74e5ce13878c.pdf?index=true", "featured": False, "order": 1},
    {"title": "Oficina sobre métodos contraceptivos e sexualidade no Ensino Fundamental", "kicker": "Saúde · Adolescência", "category": "Saúde", "external_url": "https://ojs.studiespublicacoes.com.br/ojs/index.php/cadped/article/view/14107", "featured": False, "order": 2},
    {"title": "Da narrativa literária à produção textual coletiva", "kicker": "Ensino de Ciências · Literatura", "category": "Literatura", "external_url": "https://periodicos.ifsul.edu.br/thema/pt_BR/article/view/451", "featured": False, "order": 3},
    {"title": "Das sequências didáticas à produção literária", "kicker": "Horta escolar · Literatura", "category": "Educação ambiental", "external_url": "https://revistas.ifes.edu.br/index.php/dect/en/article/view/1089", "featured": False, "order": 4},
    {"title": "A contação de história como estratégia para o ensino de ciências", "kicker": "Contação de histórias · Ciências", "category": "Ensino de Ciências", "external_url": "https://ojs.upf.br/index.php/rbecm/en/article/view/11281", "featured": False, "order": 5},
    {"title": "Textos de divulgação científica para crianças", "kicker": "Divulgação científica · Infâncias", "category": "Divulgação científica", "external_url": "https://revistarede.ifce.edu.br/ojs/index.php/rede/article/view/161", "featured": False, "order": 6},
    {"title": "Educação alimentar e nutricional como política pública nacional", "kicker": "Alimentação · Políticas públicas", "category": "Saúde", "external_url": "https://revistadaanintersh.org/index.php/anintersh/article/view/119", "featured": False, "order": 7},
    {"title": "Representações discursivas sobre questões sociocientíficas em Guerra no Rio", "kicker": "Literatura infantil · Água", "category": "Literatura", "external_url": "https://periodicorease.pro.br/rease/article/view/18896", "featured": False, "order": 8},
    {"title": "Tendências em pesquisas na aproximação da literatura infantil ao ensino de ciências", "kicker": "Revisão · Ensino de Ciências", "category": "Ensino de Ciências", "external_url": "https://publicacoes.unigranrio.edu.br/recm/article/view/5610", "featured": False, "order": 9},
    {"title": "A linguagem literária na textualização de discursos sociocientíficos", "kicker": "Linguagem · Questões hídricas", "category": "Literatura", "external_url": "https://periodicos.ifsul.edu.br/thema/pt_BR/article/view/3128", "featured": False, "order": 10},
]

SEED_PRODUCTS = [
    {"title": "Dona Seringa e a Turma dos Super Protetores", "kicker": "Saúde das crianças", "category": "Saúde infantil", "external_url": "https://educapes.capes.gov.br/handle/capes/1190834", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.03.23 (1).jpeg", "tag": None, "order": 0},
    {"title": "Trabalhando com Projetos: experiências com microbiologia", "kicker": "Educação Infantil", "category": "Educação Infantil", "external_url": "https://educapes.capes.gov.br/handle/capes/1190833", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.03.23 (2).jpeg", "tag": None, "order": 1},
    {"title": "Os Super Atletas da Saúde — O Mistério do Sorriso Campeão", "kicker": "Saúde bucal", "category": "Saúde infantil", "external_url": "https://educapes.capes.gov.br/handle/capes/1174236", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.10.28.jpeg", "tag": None, "order": 2},
    {"title": "Score Medsense: desvendando emoções na formação médica", "kicker": "Formação médica", "category": "Educação médica", "external_url": "https://share.google/NUFDNddA3VSCJpqnU", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.21.28.jpeg", "tag": None, "order": 3},
    {"title": "Guia de acompanhamento alimentar na creche", "kicker": "Educação alimentar", "category": "Educação Infantil", "external_url": "https://educapes.capes.gov.br/handle/capes/1190832", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.03.23.jpeg", "tag": None, "order": 4},
    {"title": "Além das Cicatrizes: protocolo de escuta, cuidado e intervenção", "kicker": "Saúde mental", "category": "Saúde mental", "external_url": "https://educapes.capes.gov.br/handle/capes/1190904", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.10.12.jpeg", "tag": None, "order": 5},
    {"title": "Autosserviço como Prática Pedagógica na Pré-Escola", "kicker": "Autonomia infantil", "category": "Educação Infantil", "external_url": "https://educapes.capes.gov.br/handle/capes/1174253", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.10.28 (1).jpeg", "tag": None, "order": 6},
    {"title": "Dor Abdominal no Internato de Medicina de Emergência", "kicker": "Educação médica", "category": "Educação médica", "external_url": "https://educapes.capes.gov.br/handle/capes/1190528", "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.15.57.jpeg", "tag": None, "order": 7},
    {"title": "Crescer em Saúde", "kicker": "Crianças de 0 a 3 anos", "category": "Saúde infantil", "external_url": None, "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.11.01 (1).jpeg", "tag": "Lançamento em breve", "order": 8},
    {"title": "Amamentação e alimentação de crianças de 0 a 3 anos", "kicker": "Primeira infância", "category": "Saúde infantil", "external_url": None, "image_path": "/img/prod-educacionais/WhatsApp Image 2026-09-25 at 21.11.01.jpeg", "tag": "Lançamento em breve", "order": 9},
]


def seed_publications_if_empty(db):
    if db.query(models.Publication).count() > 0:
        print("Já existem publicações cadastradas — pulando seed.")
        return
    for item in SEED_PUBLICATIONS:
        db.add(models.Publication(**item))
    db.commit()
    print(f"{len(SEED_PUBLICATIONS)} publicação(ões) inicial(is) criada(s).")


def seed_products_if_empty(db):
    created = 0
    updated = 0
    for item in SEED_PRODUCTS:
        product = db.query(models.EducationalProduct).filter(
            models.EducationalProduct.title == item["title"]
        ).first()
        if product:
            changed = False
            if not product.image_path:
                product.image_path = item["image_path"]
                changed = True
            if not product.tag and item["tag"]:
                product.tag = item["tag"]
                changed = True
            if (
                product.title == "Score Medsense: desvendando emoções na formação médica"
                and product.external_url == "https://educapes.capes.gov.br/handle/capes/971694"
            ):
                product.external_url = item["external_url"]
                changed = True
            if changed:
                updated += 1
        else:
            db.add(models.EducationalProduct(**item))
            created += 1
    db.commit()
    print(f"Produtos educacionais sincronizados: {created} criado(s), {updated} atualizado(s).")


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


def seed_books_if_empty(db):
    existing = db.query(models.Book).filter(models.Book.title == "Jogue Sementes").first()
    if existing:
        # Atualiza o cadastro legado para o link oficial enviado para o portfólio.
        existing.external_url = SEED_BOOKS[0]["external_url"]
        if not existing.cover_image:
            existing.cover_image = SEED_BOOKS[0]["cover_image"]
        db.commit()
        print("Livro 'Jogue Sementes' atualizado.")
        return
    for item in SEED_BOOKS:
        db.add(models.Book(**item))
    db.commit()
    print(f"{len(SEED_BOOKS)} livro(s) inicial(is) criado(s).")


def seed_about_images_if_empty(db):
    if db.query(models.AboutImage).count() > 0:
        print("Já existem imagens em Sobre mim — pulando seed.")
        return
    for item in SEED_ABOUT_IMAGES:
        db.add(models.AboutImage(**item))
    db.commit()
    print(f"{len(SEED_ABOUT_IMAGES)} imagem(ns) inicial(is) de Sobre mim criada(s).")


def seed_career_if_empty(db):
    if db.query(models.CareerTimelineItem).count() > 0:
        print("Já existem marcos da trajetória — pulando seed.")
        return
    db.add_all([models.CareerTimelineItem(**item) for item in DEFAULT_TIMELINE])
    db.add_all([models.CareerHighlight(**item) for item in DEFAULT_HIGHLIGHTS])
    db.commit()
    print(f"{len(DEFAULT_TIMELINE)} marco(s) inicial(is) da trajetória criado(s).")


def main():
    ensure_database_exists()
    print("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    ensure_content_columns()

    db = SessionLocal()
    try:
        create_admin_if_missing(db)
        seed_projects_if_empty(db)
        seed_books_if_empty(db)
        seed_publications_if_empty(db)
        seed_products_if_empty(db)
        seed_about_images_if_empty(db)
        seed_career_if_empty(db)
    finally:
        db.close()

    print("Inicialização concluída.")


if __name__ == "__main__":
    main()
