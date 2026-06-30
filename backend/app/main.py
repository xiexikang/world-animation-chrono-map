from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.whitelist import WhitelistMiddleware
from app.routers import anime, country, theme

app = FastAPI(
    title="世界动画地图 API",
    description="World Animation Chrono Map Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(WhitelistMiddleware)

app.include_router(anime.router)
app.include_router(country.router)
app.include_router(theme.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
