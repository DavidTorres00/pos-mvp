"""Repuebla la base con un entorno "de producción": 3 sucursales x 3 cajas, catálogo de
productos/proveedores sintético (mantiene categorías/subcategorías reales, ver
docs/info-categorias-productos.pdf) y ~30 días de historial real de operación (ventas, cajas,
pedidos a proveedor) generado ejecutando los mismos services que usa la app — no INSERTs
crudos — para que las reglas de negocio (auditoría, snapshots de stock, límites de caja) queden
exactamente igual que si un mes de trabajo real hubiera pasado. Los timestamps se reescriben
después de cada acción para simular el paso del tiempo (los services solo saben "ahora").

Uso: PYTHONPATH=. .venv/bin/python scripts/seed_demo.py
Destructivo: borra TODO lo transaccional + productos/proveedores/usuarios cajero/sucursales/
equipos existentes. Conserva categorías/subcategorías/admin/configuración.
"""

import os
import random
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete, func, select, text, update
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.alerta_acuse import AlertaAcuse
from app.models.auditoria import Auditoria
from app.models.caja import CajaSesion
from app.models.categoria import Categoria
from app.models.compra import Compra, EstadoCompra
from app.models.detalle_compra import DetalleCompra
from app.models.detalle_venta import DetalleVenta
from app.models.equipo import Equipo
from app.models.movimiento_caja import MovimientoCaja
from app.models.movimiento_inventario import MovimientoInventario
from app.models.producto import Producto
from app.models.proveedor import Proveedor
from app.models.stock_sucursal import StockSucursal
from app.models.subcategoria import Subcategoria
from app.models.sucursal import Sucursal
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import FormaPago, Venta
from app.repositories import configuracion_repository, usuario_repository
from app.schemas.compra import CompraItemCreate, CompraRecibirItem
from app.schemas.venta import VentaItemCreate
from app.services import caja_service, compra_service, equipo_service, producto_service
from app.services import proveedor_service, sucursal_service, usuario_service, venta_service

random.seed(42)

DIAS_HISTORIAL = int(os.environ.get("SEED_DIAS", "30"))  # override rápido para probar: SEED_DIAS=3
NUM_SUCURSALES = 3
EQUIPOS_POR_SUCURSAL = 3
CAJEROS_POR_SUCURSAL = 2

NOMBRES_CAJEROS = [
    "María González",
    "Carlos Ramírez",
    "Ana Torres",
    "Luis Hernández",
    "Sofía Martínez",
    "Jorge Pérez",
]

ZONA = timezone(timedelta(hours=-6))  # America/Mexico_City, sin horario de verano por simplicidad


def hoy_local() -> date:
    return datetime.now(ZONA).date()


# --------------------------------------------------------------------------------------------
# Catálogo sintético: 2 productos por subcategoría real (62 subcategorías -> 124 productos).
# Distinto del catálogo original (que se borra) pero mismo idioma de nombres/marcas mexicanas.
# --------------------------------------------------------------------------------------------
PRODUCTOS_POR_SUBCATEGORIA = {
    "Aceites": [("Aceite Nutrioli 1L", 42), ("Aceite 1-2-3 900ml", 36)],
    "Arroz": [("Arroz Verde Valle 1kg", 27), ("Arroz SOS 1kg", 24)],
    "Fideos, Pastas y Sus Salsas": [("Pasta La Moderna 200g", 18), ("Salsa para Pasta Doña Chonita 250g", 32)],
    "Menestras y Legumbres": [("Frijol Negro La Costeña 1kg", 34), ("Lenteja La Costeña 900g", 30)],
    "Harinas y Feculas": [("Harina de Trigo Selecta 1kg", 22), ("Maseca 1kg", 26)],
    "Pures, Soya, Bases y Sopas": [("Puré de Tomate Del Fuerte 300g", 20), ("Sopa Maruchan 64g", 12)],
    "Alimentos en Conserva": [("Atún Dolores 140g", 19), ("Chiles Jalapeños La Costeña 380g", 24)],
    "Condimentos, Vinagres y Salsas": [("Sal La Fina 1kg", 13), ("Salsa Valentina 370ml", 23)],
    "Frutas": [("Plátano (kg)", 16), ("Manzana Roja (kg)", 34)],
    "Mas Frutas": [("Naranja (kg)", 18), ("Papaya (kg)", 22)],
    "Mundo Chino": [("Jengibre (kg)", 45), ("Tofu 400g", 28)],
    "Verduras": [("Cebolla Blanca (kg)", 21), ("Tomate Saladet (kg)", 24)],
    "Mas Verduras": [("Zanahoria (kg)", 15), ("Papa Alpha (kg)", 19)],
    "Mundo Organico": [("Espinaca Orgánica 200g", 29), ("Lechuga Orgánica (pieza)", 26)],
    "Huevos Frescos": [("Huevo Blanco 18pz", 52), ("Huevo Rojo 12pz", 38)],
    "Leche Evaporada": [("Leche Nido Evaporada 360g", 28), ("Leche Clemente Jacques 410g", 25)],
    "Leche UTH": [("Leche Lala Entera 1L", 26), ("Leche Alpura Deslactosada 1L", 29)],
    "Yogurt": [("Yogurt Yoplait Fresa 1kg", 42), ("Yogurt Danone Natural 1L", 38)],
    "Bebidas Especiales": [("Leche de Almendra Silk 1L", 48), ("Bebida de Soya Alpura 1L", 34)],
    "Mantequillas y Margarinas": [("Mantequilla Lyncott 90g", 32), ("Margarina Primavera 90g", 16)],
    "Leche en Bolsa / Botella Vidrio": [("Leche Santa Clara (bolsa) 1L", 23), ("Leche en Botella de Vidrio 1L", 27)],
    "Otros Productos de Leche": [("Crema Lala 250ml", 24), ("Media Crema Nestlé 225g", 19)],
    "Quesos Regulares y Frescos": [("Queso Panela 400g", 58), ("Queso Oaxaca 400g", 62)],
    "Queso Gourmet": [("Queso Manchego Importado 200g", 95), ("Queso Brie 150g", 110)],
    "Quesos Regionales": [("Queso Cotija 250g", 68), ("Queso Chihuahua 400g", 64)],
    "Chorizos y Vienesas": [("Chorizo San Rafael 250g", 42), ("Salchicha Fud 500g", 38)],
    "Aceitunas": [("Aceitunas Verdes 200g", 36), ("Aceitunas Negras 200g", 38)],
    "Jamones y Jamonadas": [("Jamón de Pavo Fud 250g", 44), ("Jamonada 500g", 32)],
    "Fiambres Gourmet": [("Prosciutto 100g", 85), ("Salami Milano 150g", 58)],
    "Otros Fiambres": [("Tocino Fud 250g", 46), ("Pechuga de Pavo Ahumada 200g", 52)],
    "Carnes de Res": [("Carne Molida de Res (kg)", 135), ("Bistec de Res (kg)", 165)],
    "Carnes de Pollo": [("Pechuga de Pollo (kg)", 95), ("Pierna y Muslo de Pollo (kg)", 68)],
    "Carnes de Cerdo": [("Chuleta de Cerdo (kg)", 110), ("Costilla de Cerdo (kg)", 98)],
    "Carnes de Pavo": [("Pechuga de Pavo (kg)", 125), ("Muslo de Pavo (kg)", 88)],
    "Carnes Especiales": [("Arrachera (kg)", 245), ("Cabrería (kg)", 220)],
    "Pescados y Mariscos": [("Filete de Tilapia (kg)", 145), ("Camarón Mediano (kg)", 285)],
    "Cuidado del Cabello": [("Shampoo Head & Shoulders 375ml", 89), ("Acondicionador Sedal 340ml", 65)],
    "Cuidado Corporal": [("Jabón Dove 90g", 22), ("Crema Nivea 200ml", 68)],
    "Cuidado Bucal": [("Pasta Colgate 100ml", 34), ("Cepillo Oral-B (pieza)", 28)],
    "Afeitado y Depilacion": [("Rastrillos Gillette 4pz", 55), ("Crema de Afeitar Barbasol 200g", 42)],
    "Higiene Femenina": [("Toallas Femeninas Always 8pz", 36), ("Tampones Tampax 8pz", 48)],
    "Salud": [("Alcohol en Gel 250ml", 32), ("Curitas Curad 20pz", 24)],
    "Lavado y Cuidado de la Ropa": [("Detergente Ariel 1kg", 58), ("Suavitel 850ml", 42)],
    "Productos de Papel para el Hogar": [("Papel Higiénico Pétalo 4pz", 48), ("Toallas de Papel Pétalo 2pz", 35)],
    "Lavado y Cuidado del Hogar": [("Cloro Cloralex 950ml", 22), ("Fabuloso 1L", 28)],
    "Accesorios de Limpieza": [("Fibra Scotch Brite 3pz", 26), ("Trapeador (pieza)", 95)],
    "Agua Mineral": [("Agua Ciel 1L", 14), ("Agua Topo Chico 355ml", 18)],
    "Jugos y Bebidas": [("Jugo Del Valle 1L", 24), ("Boing Mango 1L", 20)],
    "Gaseosas": [("Coca-Cola 600ml", 18), ("Sprite 600ml", 17)],
    "Cervezas": [("Cerveza Corona 355ml", 22), ("Cerveza Victoria 355ml", 21)],
    "Vinos por Paises": [("Vino Tinto Chileno 750ml", 145), ("Vino Blanco Español 750ml", 165)],
    "Licores y Bases para Licores": [("Tequila José Cuervo 750ml", 285), ("Ron Bacardí 750ml", 245)],
    "Panaderia": [("Bolillo (pieza)", 4), ("Telera (pieza)", 4)],
    "Pasteleria": [("Pan de Muerto (pieza)", 45), ("Concha (pieza)", 12)],
    "Productos de Pollo": [("Nuggets de Pollo 500g", 68), ("Alitas Congeladas 1kg", 95)],
    "Productos de Res": [("Hamburguesa de Res 4pz", 58), ("Milanesa de Res Empanizada 500g", 78)],
    "Otros Alimentos Congelados": [("Pizza Congelada 400g", 65), ("Helado 1L", 75)],
    "Masas y Pastas Congeladas": [("Masa para Pizza 400g", 32), ("Pasta Wonton 250g", 28)],
    "Comida Criolla": [("Pozole Preparado 500g", 55), ("Mole Doña María 235g", 42)],
    "Bocaditos": [("Taquitos Congelados 12pz", 48), ("Empanadas de Queso 6pz", 38)],
    "Alimentos para Perros": [("Pedigree Adulto 2kg", 145), ("Dog Chow 2kg", 155)],
    "Alimentos para Gatos": [("Whiskas Adulto 1.5kg", 135), ("Cat Chow 1.5kg", 128)],
}

PROVEEDORES = [
    "Abarrotera del Bajío",
    "Distribuidora La Huerta",
    "Lácteos y Fiambres del Centro",
    "Carnes Selectas del Norte",
    "Cuidado e Higiene Total",
    "Grupo Limpieza Express",
    "Bebidas y Licores del Valle",
    "Congelados y Listos SA",
]


def clabe_aleatoria() -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(18))


# --------------------------------------------------------------------------------------------
# Helpers de "viaje en el tiempo": los services siempre estampan datetime.now()/func.now();
# después de cada acción se reescribe el timestamp real al simulado.
# --------------------------------------------------------------------------------------------
def max_id(db: Session, model) -> int:
    return db.execute(select(func.max(model.id))).scalar() or 0


def retag(db: Session, model, before_id: int, when: datetime) -> None:
    db.execute(update(model).where(model.id > before_id).values(created_at=when))


def dt(d: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(d, time(hour, minute), tzinfo=ZONA)


def wipe(db: Session) -> None:
    print("Borrando datos transaccionales/catálogo (se conservan categorías/subcategorías/admin)...")
    for model in [
        AlertaAcuse,
        Auditoria,
        DetalleVenta,
        MovimientoCaja,
        DetalleCompra,
        MovimientoInventario,
        StockSucursal,
    ]:
        db.execute(delete(model))
    db.execute(delete(Venta))
    db.execute(delete(CajaSesion))
    db.execute(delete(Compra))
    db.execute(delete(Producto))
    db.execute(delete(Proveedor))
    db.execute(delete(Usuario).where(Usuario.role == RolUsuario.CAJERO))
    db.execute(delete(Equipo))
    db.execute(delete(Sucursal))
    db.commit()


def crear_catalogo(
    db: Session, admin_id: int
) -> tuple[list[Sucursal], list[Proveedor], list[Producto], dict[int, list[Equipo]], dict[int, list[Usuario]]]:
    print("Creando sucursales, equipos y cajeros...")
    sucursales = []
    equipos_por_sucursal: dict[int, list[Equipo]] = {}
    cajeros_por_sucursal: dict[int, list[Usuario]] = {}
    for i in range(1, NUM_SUCURSALES + 1):
        sucursal = sucursal_service.crear(db, admin_id, f"Sucursal {i}", None, None, None, None)
        db.commit()
        sucursales.append(sucursal)
        equipos_por_sucursal[sucursal.id] = []
        for j in range(1, EQUIPOS_POR_SUCURSAL + 1):
            equipo = equipo_service.crear(db, sucursal.id, f"Equipo {j}")
            db.commit()
            equipos_por_sucursal[sucursal.id].append(equipo)
        cajeros_por_sucursal[sucursal.id] = []
        for k in range(1, CAJEROS_POR_SUCURSAL + 1):
            nombre_cajero = NOMBRES_CAJEROS[((i - 1) * CAJEROS_POR_SUCURSAL + (k - 1)) % len(NOMBRES_CAJEROS)]
            cajero = usuario_service.crear(
                db,
                admin_id,
                f"cajero{i}{k}@possystem.com",
                nombre_cajero,
                "cajero1234",
                sucursal.id,
            )
            db.commit()
            if k == 1:
                # el primer cajero de cada sucursal puede retirar excedente por su cuenta —
                # así el flujo de retiro se ejercita también en el historial simulado, no solo
                # vía el admin (ver docs/BACKEND.md, Usuario.puede_retirar_excedente)
                cajero.puede_retirar_excedente = True
                db.commit()
            cajeros_por_sucursal[sucursal.id].append(cajero)

    print("Creando proveedores...")
    proveedores = []
    for nombre in PROVEEDORES:
        proveedor = proveedor_service.crear(db, admin_id, nombre, "Compras", "55" + str(random.randint(10000000, 99999999)), None, clabe_aleatoria())
        db.commit()
        proveedores.append(proveedor)

    print("Creando productos (2 por subcategoría)...")
    subcategorias = list(db.scalars(select(Subcategoria)))
    categoria_a_proveedor: dict[int, Proveedor] = {}
    categorias = list(db.scalars(select(Categoria).order_by(Categoria.codigo)))
    for idx, categoria in enumerate(categorias):
        categoria_a_proveedor[categoria.id] = proveedores[idx % len(proveedores)]

    productos = []
    for sub in subcategorias:
        items = PRODUCTOS_POR_SUBCATEGORIA.get(sub.nombre)
        if not items:
            continue
        proveedor = categoria_a_proveedor[sub.categoria_id]
        for nombre, precio in items:
            producto = producto_service.crear(
                db, admin_id, nombre, None, Decimal(precio), None, sub.id, proveedor.id
            )
            db.commit()
            productos.append(producto)

    return sucursales, proveedores, productos, equipos_por_sucursal, cajeros_por_sucursal


def marcar_pagada_manual(db: Session, compra: Compra, admin_id: int, cuando: datetime) -> None:
    """Pasa un pedido `pendiente` a `pagada` sin llamar a OpenPay real (no hay credenciales de
    sandbox en este entorno) — mismo criterio que cualquier pedido ya liquidado fuera del
    sistema. Registra el mismo evento de auditoría que dejaría `compra_service.aprobar_y_pagar`
    para que el historial no tenga huecos."""
    compra.estado = EstadoCompra.PAGADA
    compra.aprobado_por_id = admin_id
    compra.aprobado_at = cuando
    db.add(
        Auditoria(
            usuario_id=admin_id,
            accion="compra_pagada",
            entidad="compra",
            entidad_id=compra.id,
            detalle={"total": str(compra.total), "nota": "pago manual (seed demo, sin OpenPay)"},
            created_at=cuando,
        )
    )
    db.commit()


def compra_recibida(
    db: Session, admin_id: int, proveedor_id: int, sucursal_id: int, items: list[CompraItemCreate], cuando: datetime
) -> Compra:
    """Arma+paga+recibe un pedido, backdateado a `cuando`."""
    before_aud = max_id(db, Auditoria)
    compra = compra_service.crear(db, admin_id, proveedor_id, sucursal_id, items)
    db.commit()
    retag(db, Auditoria, before_aud, cuando)
    compra.created_at = cuando
    marcar_pagada_manual(db, compra, admin_id, cuando)

    before_mov = max_id(db, MovimientoInventario)
    before_aud2 = max_id(db, Auditoria)
    recibir_items = [CompraRecibirItem(producto_id=i.producto_id, cantidad_recibida=i.cantidad) for i in items]
    compra = compra_service.recibir(db, admin_id, compra.id, recibir_items)
    compra.recibido_at = cuando
    retag(db, Auditoria, before_aud2, cuando)
    retag(db, MovimientoInventario, before_mov, cuando)
    db.commit()
    return compra


def simular_mes(
    db: Session,
    admin_id: int,
    sucursales: list[Sucursal],
    equipos_por_sucursal: dict[int, list[Equipo]],
    cajeros_por_sucursal: dict[int, list[Usuario]],
    proveedores: list[Proveedor],
    productos: list[Producto],
) -> None:
    hoy = hoy_local()
    inicio = hoy - timedelta(days=DIAS_HISTORIAL)

    stock: dict[tuple[int, int], int] = {}

    print(f"Stock inicial ({inicio}) por sucursal, vía pedido inicial recibido...")
    for sucursal in sucursales:
        proveedor = proveedores[sucursal.id % len(proveedores)]
        items = [
            CompraItemCreate(
                producto_id=p.id, cantidad=random.randint(40, 90), costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2))
            )
            for p in productos
        ]
        cuando = dt(inicio, 8, 0)
        compra_recibida(db, admin_id, proveedor.id, sucursal.id, items, cuando)
        for item in items:
            stock[(item.producto_id, sucursal.id)] = item.cantidad

    productos_por_proveedor: dict[int, list[Producto]] = {}
    for p in productos:
        productos_por_proveedor.setdefault(p.proveedor_id, []).append(p)

    dias = [inicio + timedelta(days=n) for n in range(DIAS_HISTORIAL + 1)]
    equipos_abiertos_hoy: list[tuple[Sucursal, Equipo, Usuario]] = []

    for d in dias:
        es_hoy = d == hoy
        for sucursal in sucursales:
            # restock semanal por sucursal (lunes, aprox.) — reabastece lo más vendido
            if d.weekday() == 0 and not es_hoy:
                proveedor = random.choice(proveedores)
                candidatos = productos_por_proveedor.get(proveedor.id, [])[:15]
                if candidatos:
                    items = [
                        CompraItemCreate(
                            producto_id=p.id,
                            cantidad=random.randint(15, 40),
                            costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2)),
                        )
                        for p in candidatos
                    ]
                    compra_recibida(db, admin_id, proveedor.id, sucursal.id, items, dt(d, 8, 30))
                    for item in items:
                        key = (item.producto_id, sucursal.id)
                        stock[key] = stock.get(key, 0) + item.cantidad

            equipos = equipos_por_sucursal[sucursal.id]
            cajeros = cajeros_por_sucursal[sucursal.id]
            for idx_equipo, equipo in enumerate(equipos):
                deja_abierta_hoy = es_hoy and idx_equipo == 0
                if es_hoy and not deja_abierta_hoy:
                    continue  # solo 1 caja por sucursal queda operando "ahora" en la demo
                if not es_hoy and random.random() < 0.12:
                    continue  # ~12% de los días esa caja no abrió (descanso/inactividad)

                cajero = cajeros[idx_equipo % len(cajeros)]
                monto_inicial = Decimal(random.choice([500, 800, 1000, 1500]))
                apertura = dt(d, random.randint(8, 9), random.randint(0, 59))

                before_aud = max_id(db, Auditoria)
                try:
                    caja = caja_service.abrir(db, cajero.id, equipo.id, monto_inicial)
                except Exception as exc:  # equipo ocupado / cajero ya con caja abierta, etc.
                    print(f"  [skip apertura] {sucursal.nombre}/{equipo.nombre} {d}: {exc}")
                    db.rollback()
                    continue
                db.commit()
                caja.fecha_apertura = apertura
                retag(db, Auditoria, before_aud, apertura)
                db.commit()

                num_ventas = random.randint(6, 22)
                hora_actual = apertura
                for _ in range(num_ventas):
                    disponibles = [p for p in productos if stock.get((p.id, sucursal.id), 0) > 0]
                    if not disponibles:
                        break
                    elegidos = random.sample(disponibles, k=min(random.randint(1, 4), len(disponibles)))
                    items = []
                    for p in elegidos:
                        max_qty = min(3, stock.get((p.id, sucursal.id), 0))
                        if max_qty <= 0:
                            continue
                        cantidad = random.randint(1, max_qty)
                        items.append(VentaItemCreate(producto_id=p.id, cantidad=cantidad))
                    if not items:
                        continue
                    forma_pago = random.choices(
                        [FormaPago.EFECTIVO, FormaPago.TARJETA, FormaPago.TRANSFERENCIA], weights=[70, 25, 5]
                    )[0]
                    hora_actual += timedelta(minutes=random.randint(8, 40))
                    if hora_actual.hour >= 21:
                        break
                    before_aud_v = max_id(db, Auditoria)
                    before_mov_v = max_id(db, MovimientoInventario)
                    try:
                        venta = venta_service.crear(db, cajero, items, forma_pago)
                    except Exception:
                        db.rollback()
                        continue
                    db.commit()
                    venta.created_at = hora_actual
                    retag(db, Auditoria, before_aud_v, hora_actual)
                    retag(db, MovimientoInventario, before_mov_v, hora_actual)
                    db.commit()
                    for item in items:
                        key = (item.producto_id, sucursal.id)
                        stock[key] = max(0, stock.get(key, 0) - item.cantidad)

                    # excedente natural: si ya se pasó del límite, se retira antes de seguir
                    caja_actual = caja_service.obtener_abierta(db, cajero.id)
                    if caja_actual is not None and caja_service.excede_limite(db, caja_actual):
                        before_aud_e = max_id(db, Auditoria)
                        before_mov_caja_e = max_id(db, MovimientoCaja)
                        try:
                            caja_service.retirar_excedente(db, cajero, cajero.id)
                            db.commit()
                            retag(db, Auditoria, before_aud_e, hora_actual)
                            retag(db, MovimientoCaja, before_mov_caja_e, hora_actual)
                            db.commit()
                        except Exception:
                            db.rollback()

                if deja_abierta_hoy:
                    equipos_abiertos_hoy.append((sucursal, equipo, cajero))
                    continue  # no cerrar: debe quedar "abierta ahora" para la demo en vivo

                cierre = max(hora_actual + timedelta(minutes=random.randint(10, 30)), dt(d, 20, 30))
                diferencia_roll = random.random()
                resumen_actual = caja_service.resumen(db, caja.id)
                monto_esperado = resumen_actual.monto_esperado
                if diferencia_roll < 0.08:
                    monto_final = monto_esperado - Decimal(random.randint(10, 80))
                    motivo = "Faltante detectado al contar el cajón, sin explicación clara."
                elif diferencia_roll < 0.15:
                    monto_final = monto_esperado + Decimal(random.randint(5, 40))
                    motivo = None
                else:
                    monto_final = monto_esperado
                    motivo = None

                before_aud_c = max_id(db, Auditoria)
                try:
                    caja_service.cerrar(db, cajero.id, cajero.id, monto_final, motivo)
                except Exception as exc:
                    print(f"  [skip cierre] {sucursal.nombre}/{equipo.nombre} {d}: {exc}")
                    db.rollback()
                    continue
                db.commit()
                caja.fecha_cierre = cierre
                retag(db, Auditoria, before_aud_c, cierre)
                db.commit()
        if d.day == 1 or d == hoy:
            print(f"  ...procesado hasta {d}")

    print(f"Cajas que quedan abiertas ahora: {[(s.nombre, e.nombre, c.nombre) for s, e, c in equipos_abiertos_hoy]}")

    print("Creando pedidos 'en vivo' con distintos estados (pendiente/pagada/error/rechazada)...")
    for sucursal in sucursales:
        proveedor = random.choice(proveedores)
        candidatos = productos_por_proveedor.get(proveedor.id, productos)[:5]
        items = [
            CompraItemCreate(producto_id=p.id, cantidad=random.randint(10, 30), costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2)))
            for p in candidatos
        ]
        compra_service.crear(db, admin_id, proveedor.id, sucursal.id, items)
        db.commit()

    proveedor_pagada = random.choice(proveedores)
    items_pagada = [
        CompraItemCreate(producto_id=p.id, cantidad=random.randint(10, 20), costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2)))
        for p in productos_por_proveedor.get(proveedor_pagada.id, productos)[:4]
    ]
    compra_pagada = compra_service.crear(db, admin_id, proveedor_pagada.id, sucursales[0].id, items_pagada)
    db.commit()
    marcar_pagada_manual(db, compra_pagada, admin_id, datetime.now(timezone.utc))

    proveedor_error = random.choice(proveedores)
    items_error = [
        CompraItemCreate(producto_id=p.id, cantidad=random.randint(10, 20), costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2)))
        for p in productos_por_proveedor.get(proveedor_error.id, productos)[:3]
    ]
    compra_error = compra_service.crear(db, admin_id, proveedor_error.id, sucursales[-1].id, items_error)
    db.commit()
    compra_service.aprobar_y_pagar(db, admin_id, compra_error.id)  # sin OpenPay configurado -> queda en error
    db.commit()

    proveedor_rechazada = random.choice(proveedores)
    items_rechazada = [
        CompraItemCreate(producto_id=p.id, cantidad=random.randint(5, 15), costo_unitario=Decimal(round(float(p.precio_venta) * 0.55, 2)))
        for p in productos_por_proveedor.get(proveedor_rechazada.id, productos)[:2]
    ]
    compra_rechazada = compra_service.crear(db, admin_id, proveedor_rechazada.id, sucursales[0].id, items_rechazada)
    db.commit()
    compra_service.rechazar(db, admin_id, compra_rechazada.id)
    db.commit()


def main() -> None:
    db = SessionLocal()
    try:
        admin = usuario_repository.get_by_email(db, settings.admin_email)
        if admin is None:
            raise RuntimeError("No existe el usuario admin — correr scripts/seed_admin.py primero")

        wipe(db)

        configuracion = configuracion_repository.get(db)
        configuracion.umbral_stock_bajo_default = 15
        db.commit()

        sucursales, proveedores, productos, equipos_por_sucursal, cajeros_por_sucursal = crear_catalogo(db, admin.id)
        print(f"Catálogo listo: {len(sucursales)} sucursales, {len(proveedores)} proveedores, {len(productos)} productos.")

        simular_mes(db, admin.id, sucursales, equipos_por_sucursal, cajeros_por_sucursal, proveedores, productos)

        print("Listo. Resumen:")
        for label, tabla in [("Ventas", "ventas"), ("Compras", "compras"), ("Auditoría", "auditoria")]:
            total = db.execute(text(f"select count(*) from {tabla}")).scalar()
            print(f"  {label}: {total}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
