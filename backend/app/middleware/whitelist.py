from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings

EXCLUDED_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}


class WhitelistMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.whitelist_enabled:
            return await call_next(request)

        if request.url.path in EXCLUDED_PATHS:
            return await call_next(request)

        if self._is_allowed(request):
            return await call_next(request)

        return JSONResponse(
            status_code=403,
            content={"code": 403, "message": "访问被拒绝：不在白名单内", "data": None},
        )

    def _is_allowed(self, request: Request) -> bool:
        allowed_ips = settings.whitelist_ips_list
        allowed_origins = settings.whitelist_origins_list

        if not allowed_ips and not allowed_origins:
            return False

        ip_ok = bool(allowed_ips) and self._check_ip(request, allowed_ips)
        origin_ok = bool(allowed_origins) and self._check_origin(request, allowed_origins)

        if allowed_ips and allowed_origins:
            return ip_ok or origin_ok
        if allowed_ips:
            return ip_ok
        return origin_ok

    def _check_ip(self, request: Request, allowed_ips: list[str]) -> bool:
        client_ip = self._get_client_ip(request)
        return client_ip in allowed_ips

    def _check_origin(self, request: Request, allowed_origins: list[str]) -> bool:
        origin = request.headers.get("origin")
        if origin and origin in allowed_origins:
            return True
        referer = request.headers.get("referer")
        if not referer:
            return False
        return any(referer.startswith(f"{allowed}/") or referer == allowed for allowed in allowed_origins)

    def _get_client_ip(self, request: Request) -> str:
        if settings.trust_proxy:
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                return forwarded.split(",")[0].strip()
            real_ip = request.headers.get("X-Real-IP")
            if real_ip:
                return real_ip.strip()
        if request.client:
            return request.client.host
        return ""
