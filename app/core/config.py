from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Control Horario API"
    SECRET_KEY: str = "SUPER_SECRET_KEY_CAMBIAR_EN_PRODUCCION_123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día de sesión
    DATABASE_URL: str = "sqlite:///./timesheet.db"

    class Config:
        env_file = ".env"


settings = Settings()