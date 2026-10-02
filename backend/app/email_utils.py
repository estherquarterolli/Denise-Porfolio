"""
Envio de e-mail via SMTP para o formulário de contato.
Contém proteções contra Header Injection e esgotamento de threads por timeout.
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def send_contact_email(name: str, email: str, message: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.CONTACT_RECEIVER_EMAIL:
        # SMTP não configurado — a mensagem permanece salva no banco de dados.
        return False

    # Sanitização contra Email Header Injection (impede quebras de linha \r ou \n)
    clean_name = " ".join(name.replace("\r", " ").replace("\n", " ").split())
    clean_email = email.strip().replace("\r", "").replace("\n", "")

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_USER
    msg["To"] = settings.CONTACT_RECEIVER_EMAIL
    msg["Reply-To"] = clean_email
    msg["Subject"] = f"Novo contato pelo portfólio: {clean_name}"

    body = f"Nome: {clean_name}\nE-mail: {clean_email}\n\nMensagem:\n{message}"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        # Define timeout estrito de 10s para não prender threads do servidor se o SMTP demorar
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [settings.CONTACT_RECEIVER_EMAIL], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[email_utils] Falha ao enviar e-mail de contato: {exc}")
        return False
