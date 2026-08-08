from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 720
    admin_email: str = "admin@possystem.com"
    admin_password: str
    # dueño de Soluciones Web — sin configurar, scripts/seed_superuser.py no crea nada (no todo
    # deploy necesita este acceso, ver docs/BACKEND.md)
    superuser_email: str | None = None
    superuser_password: str | None = None
    cookie_secure: bool = True
    cors_origins: str = "http://localhost:5173"

    # OpenPay (pago a proveedor al aprobar un pedido, siempre manual): sin configurar, la función
    # queda deshabilitada
    openpay_id: str | None = None
    openpay_private_key: str | None = None
    openpay_production: bool = False


settings = Settings()
