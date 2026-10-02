"""
Sistema de Rate Limit (limitação de taxa) em memória com controle de vazamento (anti-memory leak).

Protege a aplicação contra:
- Ataques de força bruta no login (/api/auth/login)
- Spam automatizado no formulário de contato (/api/contact)
- Scraping agressivo e DoS nas rotas públicas da API
- Vazamento de memória (Memory Leak) via expiração periódica de chaves inativas
- Spoofing de IP com detecção prioritária de Cloudflare (CF-Connecting-IP), X-Real-IP e X-Forwarded-For
"""
import time
from collections import deque
from typing import Callable

from fastapi import HTTPException, Request, status

# Dicionário em memória: chave -> deque de timestamps (float)
_hits: dict[str, deque] = {}
_last_cleanup: float = time.monotonic()

CLEANUP_INTERVAL_SECONDS = 300  # Limpeza periódica a cada 5 minutos
MAX_TRACKED_KEYS = 5000         # Limite máximo de chaves simultâneas na memória
EXPIRATION_SECONDS = 900        # Considera registro inativo após 15 minutos


def get_client_ip(request: Request) -> str:
    """
    Extrai o IP real do cliente.
    Prioriza o cabeçalho 'CF-Connecting-IP' da Cloudflare, seguido por 'X-Real-IP'
    e 'X-Forwarded-For' configurados pelo Traefik/Nginx.
    """
    # 1. Cloudflare
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    # 2. X-Real-IP (definido pelo proxy)
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # 3. X-Forwarded-For (primeiro IP da cadeia)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()

    # 4. Conexão TCP direta
    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def _cleanup_expired_keys(now: float) -> None:
    """Remove entradas vazias e inativas da memória para evitar Memory Leak."""
    global _last_cleanup
    _last_cleanup = now

    keys_to_remove = []
    for key, times in _hits.items():
        while times and (now - times[0]) > EXPIRATION_SECONDS:
            times.popleft()
        if not times:
            keys_to_remove.append(key)

    for key in keys_to_remove:
        _hits.pop(key, None)

    # Se ainda estiver acima do teto de chaves (ex.: ataque de spoofing massivo),
    # descarta as chaves mais antigas
    if len(_hits) > MAX_TRACKED_KEYS:
        excess = len(_hits) - MAX_TRACKED_KEYS
        for _ in range(excess):
            try:
                _hits.pop(next(iter(_hits)), None)
            except (StopIteration, KeyError):
                break


def rate_limiter(max_requests: int, window_seconds: int, scope: str = "") -> Callable:
    """
    Cria uma dependency de rate limit para rotas FastAPI.
    - `max_requests`: número máximo de requisições permitidas dentro da janela.
    - `window_seconds`: tamanho da janela de tempo em segundos.
    - `scope`: identificador opcional da funcionalidade (ex: 'login', 'contact').
    """

    def dependency(request: Request):
        global _last_cleanup
        now = time.monotonic()

        # Limpeza periódica de memória
        if (now - _last_cleanup) > CLEANUP_INTERVAL_SECONDS or len(_hits) > MAX_TRACKED_KEYS:
            _cleanup_expired_keys(now)

        ip = get_client_ip(request)
        route_identifier = scope or request.url.path
        key = f"{route_identifier}:{ip}"

        if key not in _hits:
            _hits[key] = deque()

        hits = _hits[key]

        # Descarta timestamps fora da janela de tempo atual
        while hits and (now - hits[0]) > window_seconds:
            hits.popleft()

        # Verifica se excedeu o limite
        if len(hits) >= max_requests:
            retry_after = int(window_seconds - (now - hits[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas requisições. Por favor, aguarde antes de tentar novamente.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        hits.append(now)

    return dependency
