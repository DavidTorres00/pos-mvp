from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.orden_reorden import EstadoOrdenReorden
from app.schemas.producto import ProductoOut
from app.schemas.proveedor import ProveedorOut
from app.schemas.usuario import UsuarioOut


class OrdenReordenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    regla_reorden_id: int
    producto_id: int
    producto: ProductoOut
    proveedor_id: int
    proveedor: ProveedorOut
    cantidad: int
    monto_estimado: Decimal
    estado: EstadoOrdenReorden
    aprobado_por_id: int | None
    aprobado_por: UsuarioOut | None
    aprobado_at: datetime | None
    openpay_payment_id: str | None
    error: str | None
    created_at: datetime
