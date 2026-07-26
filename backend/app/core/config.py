from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 720
    admin_email: str = "admin@possystem.com"
    admin_password: str = "change-me-admin"
    cookie_secure: bool = True


settings = Settings()
