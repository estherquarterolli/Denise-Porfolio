# Deploy em VPS (Hostinger) — guia passo a passo

Este guia assume um VPS Hostinger com **Ubuntu 22.04/24.04**, acesso root via SSH,
e um domínio já apontando (registro A) para o IP do VPS.

## 0. Antes de tudo: checklist de segurança

Antes de colocar no ar, garanta que:

- [ ] `backend/.env` tem um `SECRET_KEY` novo e aleatório (não o do seu ambiente de dev)
- [ ] `ADMIN_PASSWORD` foi trocado para uma senha forte (o `denise123` atual **não** deve ir para produção)
- [ ] `ENVIRONMENT=production` está definido (desliga `/docs`, `/redoc`, `/openapi.json` e ativa HSTS)
- [ ] `FRONTEND_ORIGIN` aponta para o domínio real (`https://seudominio.com.br`)
- [ ] `.env` **nunca** é commitado (já está no `.gitignore`)
- [ ] O SMTP do formulário de contato usa uma "senha de app" real, não a senha normal da conta de e-mail

## 1. Preparar o servidor

```bash
ssh root@SEU_IP_VPS

apt update && apt upgrade -y
apt install -y python3-venv python3-pip nginx git ufw

# Firewall: só SSH, HTTP e HTTPS
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw enable
```

Crie um usuário não-root para rodar a aplicação (evita rodar o serviço como root):

```bash
adduser --disabled-password --gecos "" denise
usermod -aG sudo denise
su - denise
```

## 2. Clonar e configurar o projeto

```bash
cd ~
git clone <url-do-seu-repositorio> denise-portfolio
cd denise-portfolio/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env   # preencha com os valores reais de produção
```

Gere um `SECRET_KEY` forte:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Gere um hash para conferir sua senha de admin antes de subir (opcional, só para
testar localmente) — na prática, o `ADMIN_PASSWORD` do `.env` é usado por
`init_db.py` para criar o usuário admin na primeira vez que o banco é criado.

Rode a inicialização do banco (cria tabelas + usuário admin + conteúdo seed):

```bash
python init_db.py
```

> Se este for um redeploy e o `denise_portfolio.db` já existir com um admin
> diferente, troque a senha depois pelo próprio painel (ainda não existe rota
> de "trocar senha" no admin — troque direto no banco ou peça pra eu adicionar
> essa tela se for usar isso com frequência).

## 3. Rodar como serviço (systemd)

Crie `/etc/systemd/system/denise-portfolio.service`:

```ini
[Unit]
Description=Denise Portfolio (FastAPI/Uvicorn)
After=network.target

[Service]
User=denise
Group=denise
WorkingDirectory=/home/denise/denise-portfolio/backend
Environment="PATH=/home/denise/denise-portfolio/backend/venv/bin"
ExecStart=/home/denise/denise-portfolio/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

# Hardening básico do systemd
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/home/denise/denise-portfolio/backend

[Install]
WantedBy=multi-user.target
```

> `--workers 2` já basta para um site pessoal de baixo tráfego. O rate-limit
> de login/contato do app é por processo (em memória), então com mais de um
> worker o limite efetivo multiplica pelo número de workers — para um site
> pequeno isso é aceitável; se quiser um limite exato, mova essa checagem
> para o nginx (`limit_req`, abaixo) e deixe 1 worker.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now denise-portfolio
sudo systemctl status denise-portfolio
```

## 4. Nginx como proxy reverso

Crie `/etc/nginx/sites-available/denise-portfolio`:

```nginx
limit_req_zone $binary_remote_addr zone=login_zone:10m rate=5r/m;

server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    client_max_body_size 8M;  # um pouco acima do MAX_UPLOAD_SIZE_MB do .env

    location /api/auth/login {
        limit_req zone=login_zone burst=3 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/denise-portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. HTTPS com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

O certbot edita o bloco do nginx automaticamente para redirecionar HTTP → HTTPS
e renova o certificado sozinho (timer do systemd já vem habilitado).

## 6. Conferência final

- [ ] `https://seudominio.com.br` abre o site (cadeado válido)
- [ ] `https://seudominio.com.br/admin.html` pede login e funciona
- [ ] `https://seudominio.com.br/docs` retorna 404 (confirma `ENVIRONMENT=production`)
- [ ] `curl -I https://seudominio.com.br` mostra os headers `X-Frame-Options`,
      `X-Content-Type-Options` e `Strict-Transport-Security`
- [ ] Testar o formulário de contato e confirmar que o e-mail chega
- [ ] Trocar a senha do admin se ainda estiver com a de desenvolvimento

## 7. Backups

O banco é um arquivo único (`backend/denise_portfolio.db`) e os uploads ficam
em `backend/uploads/`. Um cron simples já cobre o essencial:

```bash
# /etc/cron.d/denise-portfolio-backup
0 3 * * * denise tar -czf /home/denise/backups/backup-$(date +\%F).tar.gz -C /home/denise/denise-portfolio/backend denise_portfolio.db uploads
```

Crie a pasta antes: `mkdir -p /home/denise/backups`. Considere copiar esses
arquivos periodicamente para fora do VPS (S3, outro servidor, etc.) — um backup
que mora só na mesma máquina não protege contra a máquina inteira falhar.

## 8. Atualizando o site depois do primeiro deploy

```bash
cd ~/denise-portfolio
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
python init_db.py   # idempotente — só cria o que ainda não existe
sudo systemctl restart denise-portfolio
```
