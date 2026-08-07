from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ConfiguracionNegocioUpdate(BaseModel):
    limite_efectivo_caja: Decimal | None = Field(default=None, ge=0)
    umbral_stock_bajo_default: int | None = Field(default=None, ge=0)


class ConfiguracionNegocioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    limite_efectivo_caja: Decimal | None
    umbral_stock_bajo_default: int | None
    updated_at: datetime
