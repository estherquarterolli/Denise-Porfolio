"""Limitador de taxa simples, em memória, por IP.

Não substitui um WAF/proxy com rate limit de verdade em produção (veja o
bloco `limit_req` sugerido no nginx do DEPLOY.md), mas evita que a rota de
login e o formulário de contato sejam martelados sem nenhuma barreira.
"""
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_hits: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # Atrás de um proxy reverso (nginx), o IP real vem em X-Forwarded-For.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limiter(max_requests: int, window_seconds: int):
    """Cria uma dependency que permite `max_requests` a cada `window_seconds` por IP+rota."""

    def dependency(request: Request):
        key = f"{request.url.path}:{_client_ip(request)}"
        now = time.monotonic()
        hits = _hits[key]

        while hits and now - hits[0] > window_seconds:
            hits.popleft()

        if len(hits) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas. Aguarde um pouco e tente novamente.",
            )

        hits.append(now)

    return dependency
