# Portfólio — Denise Ana Augusta dos Santos Oliveira

Site portfólio acadêmico com CRUD de projetos, feito em **Python (FastAPI)** +
**PostgreSQL**, com frontend em HTML/CSS/JS puro animado com **GSAP** e ícones
**Phosphor**.

## Estrutura do projeto

```
denise-portfolio/
├── backend/
│   ├── app/
│   │   ├── main.py          # app FastAPI, monta rotas + arquivos estáticos
│   │   ├── config.py        # variáveis de ambiente (.env)
│   │   ├── database.py      # engine/sessão SQLAlchemy
│   │   ├── models.py        # tabelas: Project, ProjectImage, AdminUser, ContactMessage
│   │   ├── schemas.py       # validação Pydantic
│   │   ├── auth.py          # hashing de senha + JWT
│   │   ├── crud.py          # funções de acesso ao banco
│   │   ├── email_utils.py   # envio de e-mail (SMTP) do formulário de contato
│   │   └── routers/
│   │       ├── auth_routes.py   # POST /api/auth/login
│   │       ├── projects.py      # CRUD de projetos + upload de imagens
│   │       └── contact.py       # formulário de contato
│   ├── init_db.py           # cria tabelas + usuário admin + projetos de exemplo
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html            # site público (landing única, com scroll)
    ├── admin.html            # painel administrativo (CRUD)
    ├── css/
    │   ├── style.css         # visual do site público (claro, cores fortes)
    │   └── admin.css         # visual do admin (simples/funcional)
    ├── js/
    │   ├── main.js           # animações GSAP + fetch dos projetos + filtro/busca + contato
    │   └── admin.js          # login JWT + CRUD + upload de imagens
    └── img/
        ├── jogue-sementes-capa.jpeg
        ├── eventos-mosaico.jpeg
        └── sobre-mim/            # fotos do carrossel da seção "Sobre mim"
            ├── retrato.jpeg
            ├── palco.jpeg
            ├── autografo.jpeg
            └── retrato-preto.jpeg
```

## Passo a passo para rodar localmente

### 1. Banco de dados PostgreSQL

Crie um banco local (ajuste usuário/senha conforme o seu Postgres):

```bash
createdb denise_portfolio
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edite o .env: DATABASE_URL, SECRET_KEY, ADMIN_USERNAME/ADMIN_PASSWORD,
# e (opcional) as credenciais SMTP para o formulário de contato enviar e-mail.

python init_db.py                 # cria tabelas + usuário admin + projetos de exemplo

uvicorn app.main:app --reload     # sobe em http://localhost:8000
```

Isso já serve **tudo**: a API em `/api/...`, o site público em `/`, o painel
admin em `/admin`, e as imagens enviadas em `/uploads/...`.

### 3. Acessar

- Site público: http://localhost:8000
- Painel admin: http://localhost:8000/admin
  - Usuário/senha = o que você definiu em `ADMIN_USERNAME` / `ADMIN_PASSWORD` no `.env`

### 4. Gerenciar conteúdo e imagens

- Livros: podem ser criados e editados no painel `/admin`, incluindo envio,
  troca e remoção da imagem/capa.
- Sobre mim: a aba própria do painel permite adicionar, ordenar, legendar e
  remover as imagens exibidas na galeria pública.
- Projetos: são gerenciados pelo painel (criar, editar, excluir e adicionar imagens).
- Textos institucionais, publicações e produtos educacionais ficam em
  `frontend/index.html`.

## Notas técnicas

- **Autenticação**: login gera um JWT (`/api/auth/login`), guardado no
  `localStorage` do navegador e enviado como `Authorization: Bearer <token>`
  em toda rota protegida (criar/editar/excluir projeto, upload de imagem,
  ver mensagens de contato).
- **Upload de imagens**: salvas em `backend/uploads/`, servidas como
  arquivos estáticos. Cada projeto pode ter várias imagens (galeria).
- **Formulário de contato**: salva sempre no banco (`contact_messages`); se
  as variáveis `SMTP_*` estiverem preenchidas no `.env`, também tenta enviar
  um e-mail. Sem SMTP configurado, a mensagem só fica salva (visível na aba
  "Mensagens" do admin).
- **Filtro e busca de projetos**: feitos via query params na própria API
  (`/api/projects?category=...&q=...`), então funcionam mesmo com muitos
  projetos cadastrados.
- **Animações**: GSAP + ScrollTrigger (CDN) para as transições de scroll e
  o efeito de entrada no hero; nada de biblioteca pesada de mais.
- **Responsividade**: menu vira hambúrguer, grids colapsam, tipografia usa
  `clamp()` — testado mentalmente para mobile/tablet/desktop.
- Este projeto cria as tabelas via `Base.metadata.create_all` (bom para
  desenvolvimento). Para produção, o ideal é migrar para **Alembic**.

## Próximos passos sugeridos

- Trocar a foto/bio placeholder pelas informações reais definitivas.
- Rodar `init_db.py` de novo depois de mudar `ADMIN_PASSWORD` (ou trocar a
  senha direto no banco) antes de publicar o site.
- Quando for pensar em deploy: Render/Railway (Postgres gerenciado) é o
  caminho mais simples para FastAPI + Postgres.
