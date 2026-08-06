from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AlertaAcuse(Base):
    """'Ya lo revisé' sobre una alerta puntual del feed de atención (`reporte_service.atencion`).

    Solo aplica a alertas basadas en un hecho histórico e inmutable — hoy únicamente
    `faltante_caja`: la caja ya cerró con faltante, no hay ninguna acción futura que lo
    "resuelva" por sí sola. Deliberadamente no aplica a las alertas de condición viva
    (`caja_excedida`, `caja_sin_cierre`, `orden_reorden_*`, `stock_bajo_sin_regla`): esas ya
    desaparecen solas en cuanto se arregla el problema real que describen, y acusarlas a mano
    solo escondería un problema que sigue vivo.

    `tipo`+`referencia_id` genérico a propósito (no solo `auditoria_id`) por si algún futuro
    tipo de alerta puntual necesita lo mismo, sin rediseñar la tabla — pero el service valida
    qué tipos acepta, no cualquiera."""

    __tablename__ = "alertas_acuse"
    __table_args__ = (UniqueConstraint("tipo", "referencia_id", name="uq_alertas_acuse_tipo_referencia"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    referencia_id: Mapped[int] = mapped_column(Integer, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
