from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.movimiento_inventario import TipoMovimiento
from app.schemas.producto import ProductoOut


class MovimientoCreate(BaseModel):
    producto_id: int
    tipo: TipoMovimiento
    cantidad: int = Field(gt=0)
    motivo: str | None = None


class MovimientoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    tipo: TipoMovimiento
    cantidad: int
    stock_resultante: int
    motivo: str | None
    created_at: datetime
