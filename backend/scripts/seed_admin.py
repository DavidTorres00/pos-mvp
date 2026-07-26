from app.core.config import settings
from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.usuario import Usuario
from app.repositories import usuario_repository


def main() -> None:
    db = SessionLocal()
    try:
        if usuario_repository.get_by_email(db, settings.admin_email) is not None:
            print(f"Usuario admin '{settings.admin_email}' ya existe, no se crea de nuevo.")
            return

        admin = Usuario(
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
            nombre="Administrador",
            activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"Usuario admin '{settings.admin_email}' creado.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
