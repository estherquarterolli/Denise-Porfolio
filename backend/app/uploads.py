"""
Helpers de upload de imagem compartilhados pelas rotas do admin.

Medidas de segurança aplicadas:
1. Validação de Content-Type declarado.
2. Limite de tamanho via leitura em streaming de chunks (evita esgotamento de memória DoS).
3. Validação binária estrita de 'Magic Bytes' (evita execução ou armazenamento de scripts disfarçados).
4. Extensão forçada a partir da assinatura binária detectada (nunca do nome fornecido pelo usuário).
5. Nomeação aleatória via UUIDv4 (previne colisão de nomes e ataques de Path Traversal).
"""
import os
import uuid

from fastapi import HTTPException, UploadFile, status

from app.config import settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def validate_image_magic_bytes(content: bytes) -> str | None:
    """Verifica a assinatura binária real (magic bytes) do cabeçalho do arquivo."""
    if len(content) < 12:
        return None
    # JPEG: FF D8 FF
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    # GIF: GIF87a ou GIF89a
    if content.startswith(b"GIF87a") or content.startswith(b"GIF89a"):
        return ".gif"
    # WEBP: RIFF....WEBP
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"
    return None


async def save_image_upload(file: UploadFile, prefix: str = "") -> str:
    """
    Valida, lê em chunks controlados e grava um upload de imagem com segurança.
    Retorna o caminho público relativo salvo.
    """
    expected_ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if not expected_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Envie apenas JPG, PNG, WEBP ou GIF.",
        )

    # Leitura em streaming com verificação antecipada de tamanho
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contents = bytearray()
    chunk_size = 64 * 1024  # 64 KB

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        contents.extend(chunk)
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Arquivo excede o tamanho máximo de {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado está vazio.",
        )

    # Validação binária rigorosa do cabeçalho
    detected_ext = validate_image_magic_bytes(contents)
    if not detected_ext or detected_ext != expected_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O conteúdo do arquivo não corresponde a uma imagem válida.",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{prefix}{uuid.uuid4().hex}{detected_ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as destination:
        destination.write(contents)

    return f"/{settings.UPLOAD_DIR}/{filename}"


def delete_uploaded_file(relative_path: str | None) -> None:
    """Remove um arquivo de uploads/ com proteção estrita contra Path Traversal."""
    if not relative_path or not relative_path.startswith(f"/{settings.UPLOAD_DIR}/"):
        return
    # Extrai estritamente o basename para impedir qualquer tentativa de ../
    filename = os.path.basename(relative_path)
    path = os.path.join(settings.UPLOAD_DIR, filename)
    if os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass
