from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class VentasDiaOut(BaseModel):
    fecha: date
    total_ventas: Decimal
    cantidad_ventas: int
