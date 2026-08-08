import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.sucursal import Sucursal


class RolUsuario(str, enum.Enum):
    ADMIN = "admin"
    CAJERO = "cajero"
    # dueño de Soluciones Web (nosotros) — gestiona el cupo de equipos habilitados por instalación,
    # sin acceso a ningún módulo de negocio del cliente (ventas/caja/catálogo/etc.), ver
    # app/modules/superadmin
    SUPERUSER = "superuser"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RolUsuario] = mapped_column(Enum(RolUsuario, name="rol_usuario"), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # habilita a un cajero a ejecutar el retiro de excedente de caja (admin siempre puede); el
    # admin lo otorga por cajero según convenga operativamente (§4.3)
    puede_retirar_excedente: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # habilita a un cajero a procesar devoluciones (admin siempre puede) — mismo patrón que
    # puede_retirar_excedente, ver docs/BACKEND.md
    puede_hacer_devoluciones: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # nulo para admin (ve todas las sucursales remotamente); obligatorio para cajero, forzado por
    # ck_usuarios_cajero_requiere_sucursal a nivel de base de datos, no solo validación de app
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    sucursal: Mapped[Sucursal | None] = relationship(lazy="joined")

    @property
    def sucursal_nombre(self) -> str | None:
        return self.sucursal.nombre if self.sucursal is not None else None
