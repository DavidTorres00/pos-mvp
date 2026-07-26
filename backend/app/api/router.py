from fastapi import APIRouter

from app.modules.caja.router import router as caja_router
from app.modules.categorias.router import router as categorias_router
from app.modules.compras.router import router as compras_router
from app.modules.inventario.router import router as inventario_router
from app.modules.productos.router import router as productos_router
from app.modules.reportes.router import router as reportes_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.ventas.router import router as ventas_router

api_router = APIRouter(prefix="/api")
api_router.include_router(usuarios_router)
api_router.include_router(productos_router)
api_router.include_router(categorias_router)
api_router.include_router(inventario_router)
api_router.include_router(caja_router)
api_router.include_router(compras_router)
api_router.include_router(ventas_router)
api_router.include_router(reportes_router)
