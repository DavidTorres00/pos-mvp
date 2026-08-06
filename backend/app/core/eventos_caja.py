import asyncio


class RegistroEventosCaja:
    """Pub/sub en memoria, scopeado por `usuario_id` — no por rol: un cajero solo tiene una
    caja abierta a la vez en un equipo, así que `usuario_id` ya identifica sin ambigüedad esa
    sesión de caja/equipo puntual (nunca se notifica a 'todos los cajeros').

    Complementa al polling de 15s de `useCajaActual` (frontend), no lo reemplaza: cuando un
    admin retira el excedente o cierra la caja de otro usuario (`caja_service.retirar_excedente`
    / `cerrar`), esto avisa a la sesión SSE de ese cajero para que refresque al instante en vez
    de esperar el siguiente ciclo de polling. Los dos canales nunca compiten por la información
    — ninguno transporta el estado en sí, solo son una señal de "algo cambió, vuelve a pedir tu
    caja actual"; la única fuente de verdad sigue siendo `GET /caja/actual`. Si el navegador no
    soporta/permite streams o la conexión se cae, el polling sigue cubriendo sin degradar nada.

    En memoria del proceso porque el backend corre en una sola instancia — si algún día se
    escala a varios procesos/workers, esto necesitaría pub/sub real (Redis) en vez de un dict."""

    def __init__(self) -> None:
        self._colas: dict[int, list[asyncio.Queue[None]]] = {}

    def suscribirse(self, usuario_id: int) -> asyncio.Queue[None]:
        cola: asyncio.Queue[None] = asyncio.Queue()
        self._colas.setdefault(usuario_id, []).append(cola)
        return cola

    def desuscribirse(self, usuario_id: int, cola: asyncio.Queue[None]) -> None:
        colas = self._colas.get(usuario_id)
        if colas and cola in colas:
            colas.remove(cola)
            if not colas:
                del self._colas[usuario_id]

    def notificar(self, usuario_id: int) -> None:
        for cola in self._colas.get(usuario_id, []):
            cola.put_nowait(None)


eventos_caja = RegistroEventosCaja()
