from app.core.config import settings
from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.usuario import RolUsuario, Usuario
from app.repositories import usuario_repository


def main() -> None:
    if not settings.superuser_email or not settings.superuser_password:
        print("SUPERUSER_EMAIL/SUPERUSER_PASSWORD no configurados en .env, no se crea nada.")
        return

    db = SessionLocal()
    try:
        if usuario_repository.get_by_email(db, settings.superuser_email) is not None:
            print(f"Usuario superuser '{settings.superuser_email}' ya existe, no se crea de nuevo.")
            return

        superuser = Usuario(
            email=settings.superuser_email,
            password_hash=hash_password(settings.superuser_password),
            nombre="Soluciones Web",
            role=RolUsuario.SUPERUSER,
            activo=True,
        )
        db.add(superuser)
        db.commit()
        print(f"Usuario superuser '{settings.superuser_email}' creado.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
