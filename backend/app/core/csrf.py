from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.security import CSRF_COOKIE_NAME, CSRF_HEADER_NAME

_METODOS_SEGUROS = {"GET", "HEAD", "OPTIONS"}
_RUTAS_EXENTAS = {"/api/auth/login"}


class CSRFMiddleware(BaseHTTPMiddleware):
    """Valida el patrón double-submit cookie para todo método mutante autenticado por cookie."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in _METODOS_SEGUROS and request.url.path not in _RUTAS_EXENTAS:
            cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
            header_token = request.headers.get(CSRF_HEADER_NAME)
            if not cookie_token or not header_token or cookie_token != header_token:
                return JSONResponse(status_code=403, content={"detail": "Token CSRF inválido o ausente"})
        return await call_next(request)
