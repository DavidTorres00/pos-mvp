from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ConfiguracionNegocioUpdate(BaseModel):
    limite_efectivo_caja: Decimal | None = Field(default=None, ge=0)
    openpay_tope_por_orden: Decimal | None = Field(default=None, ge=0)
    openpay_tope_diario: Decimal | None = Field(default=None, ge=0)


class ConfiguracionNegocioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    limite_efectivo_caja: Decimal | None
    openpay_tope_por_orden: Decimal | None
    openpay_tope_diario: Decimal | None
    updated_at: datetime
