from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.movimiento_inventario import TipoMovimiento
from app.schemas.producto import ProductoOut


class MovimientoCreate(BaseModel):
    producto_id: int
    tipo: TipoMovimiento
    cantidad: int
    motivo: str | None = None


class MovimientoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    tipo: TipoMovimiento
    cantidad: int
    motivo: str | None
    created_at: datetime
