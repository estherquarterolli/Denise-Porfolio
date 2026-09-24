"""
Envio de e-mail via SMTP para o formulário de contato.
Se as credenciais SMTP não estiverem configuradas no .env, o envio é
simplesmente pulado (a mensagem ainda fica salva no banco).
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


def send_contact_email(name: str, email: str, message: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.CONTACT_RECEIVER_EMAIL:
        # SMTP não configurado — mensagem fica salva no banco mesmo assim.
        return False

    msg = MIMEMultipart()
    msg["From"] = settings.SMTP_USER
    msg["To"] = settings.CONTACT_RECEIVER_EMAIL
    msg["Subject"] = f"Novo contato pelo portfólio: {name}"

    body = f"Nome: {name}\nE-mail: {email}\n\nMensagem:\n{message}"
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, [settings.CONTACT_RECEIVER_EMAIL], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 — não queremos derrubar a request por falha de e-mail
        print(f"[email_utils] Falha ao enviar e-mail de contato: {exc}")
        return False
