from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.models import User, TimeEntry
from app.api.v1.auth import router as auth_router
from app.api.v1.timesheet import router as timesheet_router
from app.api.v1.users import router as users_router

# Crear las tablas en SQLite al arrancar la aplicación
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API REST para el control de jornada laboral, fichajes y gestión de personal.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(timesheet_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
    }