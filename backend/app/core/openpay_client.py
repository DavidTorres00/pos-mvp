from decimal import Decimal

import httpx

from app.core.config import settings

_BASE_URL_PRODUCCION = "https://api.openpay.mx/v1"
_BASE_URL_SANDBOX = "https://sandbox-api.openpay.mx/v1"


class OpenPayError(Exception):
    pass


class OpenPayNoConfiguradoError(OpenPayError):
    pass


def _base_url() -> str:
    return _BASE_URL_PRODUCCION if settings.openpay_production else _BASE_URL_SANDBOX


def crear_payout(monto: Decimal, clabe: str, nombre_beneficiario: str, descripcion: str, referencia: str) -> str:
    """Crea un traspaso (payout) a la cuenta bancaria del proveedor vía la API REST de OpenPay
    (HTTP Basic Auth con la llave privada, sin el SDK oficial `openpay` de PyPI: ese paquete usa
    `use_2to3` y no compila en Python 3.13, por eso se llama al API directo con httpx).

    `referencia` es la llave de idempotencia (order_id) que OpenPay usa para no duplicar el
    traspaso ante un reintento.

    Devuelve el id de la transacción en OpenPay para guardarlo en Compra.openpay_payment_id.

    NOTA para producción: el endpoint y la forma del payload (`/payouts`, `bank_account.clabe`)
    siguen la documentación pública de OpenPay Payouts; no hay credenciales de sandbox en este
    entorno para verificarlo en vivo. Validar contra el sandbox real de OpenPay antes de aprobar
    la primera orden en producción.
    """
    if not settings.openpay_id or not settings.openpay_private_key:
        raise OpenPayNoConfiguradoError("OpenPay no está configurado (faltan OPENPAY_ID / OPENPAY_PRIVATE_KEY)")

    url = f"{_base_url()}/{settings.openpay_id}/payouts"
    payload = {
        "method": "bank_account",
        "amount": float(monto),
        "description": descripcion,
        "order_id": referencia,
        "bank_account": {"clabe": clabe, "holder_name": nombre_beneficiario},
    }
    try:
        response = httpx.post(url, json=payload, auth=(settings.openpay_private_key, ""), timeout=30.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise OpenPayError(f"Error al comunicarse con OpenPay: {exc}") from exc

    data = response.json()
    payment_id = data.get("id")
    if not payment_id:
        raise OpenPayError("OpenPay no devolvió un id de transacción")
    return payment_id
