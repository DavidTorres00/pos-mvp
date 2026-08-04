from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 720
    admin_email: str = "admin@possystem.com"
    admin_password: str
    cookie_secure: bool = True
    cors_origins: str = "http://localhost:5173"

    # OpenPay (pago automático a proveedor, §4.6): sin configurar, la función queda deshabilitada
    openpay_id: str | None = None
    openpay_private_key: str | None = None
    openpay_production: bool = False


settings = Settings()
