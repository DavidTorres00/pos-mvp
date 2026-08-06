from datetime import date, datetime
from zoneinfo import ZoneInfo

# La base de datos ya interpreta los timestamptz en esta zona (TimeZone de la sesión de
# Postgres, configurado a nivel de base/rol, no por la app) — México va detrás de UTC, así que
# un `datetime.now(UTC).date()` se adelanta al día siguiente varias horas antes de la
# medianoche real del negocio. Pinneado explícito, no el reloj del sistema donde corra la app:
# un deploy en un host con TZ=UTC rompería lo mismo que este bug si dependiéramos de eso.
ZONA_NEGOCIO = ZoneInfo("America/Mexico_City")


def hoy_negocio() -> date:
    """'Hoy' en la zona horaria del negocio — usar para cualquier default de 'fecha actual' que
    después se compara contra columnas timestamptz vía `func.date(...)` (ventas del día, tope
    diario de OpenPay, etc.), para que coincida con el día que Postgres ya calcula."""
    return datetime.now(ZONA_NEGOCIO).date()
