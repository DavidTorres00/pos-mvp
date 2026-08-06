import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LiveClock } from '@/components/LiveClock'
import { SelectField } from '@/components/form/SelectField'
import { SplitBrandScreen } from '@/components/SplitBrandScreen'
import { useAbrirCaja } from '@/features/caja/hooks/useCajaMutations'
import { useEquiposDisponibles } from '@/features/caja/hooks/useEquiposDisponibles'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { aperturaSchema, type AperturaFormValues } from '@/features/caja/schemas/cajaSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDate } from '@/lib/format'
import { numeroDesdeTexto, sanitizarNumeroNoNegativo } from '@/lib/numericInput'

interface AbrirCajaSplashProps {
  nombre: string
  limiteEfectivo: string | null
  ultimoCierre: string | null
}

const MONTOS_RAPIDOS = [500, 1000, 1500, 3000]

// Pantalla completa (sin sidebar ni navegación) que recibe al cajero justo después de iniciar
// sesión mientras no exista ninguna caja abierta: aún no hay nada que hacer en el sistema hasta
// contar el monto inicial, así que no tiene sentido mostrarle el resto de la app.
export function AbrirCajaSplash({ nombre, limiteEfectivo, ultimoCierre }: AbrirCajaSplashProps) {
  const abrir = useAbrirCaja()
  const logout = useLogout()
  const { data: equipos = [] } = useEquiposDisponibles()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<AperturaFormValues>({
    resolver: zodResolver(aperturaSchema),
    defaultValues: { equipo_id: null },
  })

  // con un solo equipo disponible no tiene sentido pedir una decisión sin opciones reales: se
  // autoselecciona y se muestra como etiqueta fija de solo lectura. Sin `shouldValidate`: con
  // un resolver de schema (zod), validar UN campo obliga a validar el objeto completo — forzar
  // esto en un efecto de fondo hacía aparecer el error de `monto_inicial` (si estaba vacío)
  // antes de que el cajero intentara enviar nada
  useEffect(() => {
    if (equipos.length === 1) {
      setValue('equipo_id', equipos[0].id)
    }
  }, [equipos, setValue])

  const montosRapidos =
    limiteEfectivo != null ? MONTOS_RAPIDOS.filter((m) => m <= Number(limiteEfectivo)) : MONTOS_RAPIDOS
  const equipoOptions = equipos.map((equipo) => ({ value: String(equipo.id), label: equipo.nombre }))

  // este input no pasa por components/ui/input.tsx (tipografía fluida propia, ver más abajo),
  // así que necesita el mismo saneo de onChange armado a mano: register() ya trae su propio
  // onChange (setValueAs transforma el string ya saneado a número), así que se envuelve en vez
  // de pisarlo
  const montoInicialField = register('monto_inicial', { setValueAs: numeroDesdeTexto })

  function onSubmit(values: AperturaFormValues) {
    if (abrir.isPending) return
    abrir.mutate({ equipo_id: values.equipo_id as number, monto_inicial: values.monto_inicial })
  }

  return (
    <SplitBrandScreen
      footer={
        <>
          {ultimoCierre && (
            <p>
              Último cierre <span className="font-medium text-primary-foreground">{formatDate(ultimoCierre)}</span>
            </p>
          )}
          <div className="mt-4">
            <LiveClock />
          </div>
        </>
      }
    >
      <form className="flex w-full max-w-[clamp(640px,55vw,1280px)] flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Apertura de caja</p>
            <h2 className="mt-1 text-[clamp(1.75rem,3vw,2.75rem)] font-bold tracking-tight">Bienvenido, {nombre}</h2>
            <p className="mt-2 max-w-md text-base text-muted-foreground">
              Cuenta el efectivo con el que arrancas y captura el monto inicial.
            </p>
          </div>
          <div className="shrink-0 text-right text-xs whitespace-nowrap">
            <p className="font-medium tracking-wide text-muted-foreground uppercase">Sesión iniciada</p>
            <p className="font-medium text-foreground">{nombre} · Cajero</p>
          </div>
        </div>

        <div className="border-t" />

        <div className="flex flex-col gap-3">
          {equipos.length > 1 ? (
            <SelectField
              control={control}
              name="equipo_id"
              label="Equipo"
              placeholder="Selecciona un equipo"
              options={equipoOptions}
              error={errors.equipo_id}
              parse={(value) => Number(value)}
            />
          ) : (
            equipos.length === 1 && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Equipo</Label>
                <p className="text-sm font-medium text-foreground">{equipos[0].nombre}</p>
              </div>
            )
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="monto_inicial" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Monto inicial · MXN
          </Label>
          <div className="flex items-baseline gap-2 border-b-2 pb-3 focus-within:border-primary">
            <span className="text-[clamp(1.75rem,3vw,3rem)] font-bold text-muted-foreground">$</span>
            <input
              id="monto_inicial"
              // texto real, no `type="number"`: ese tipo nativo puede mostrar texto inválido en
              // pantalla mientras el `value` que JS lee ya colapsó a "" — el saneo de abajo
              // nunca alcanzaría a verlo (ver lib/numericInput.ts)
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              aria-invalid={!!errors.monto_inicial}
              className="w-full border-0 bg-transparent text-[clamp(3rem,7vw,6rem)] font-bold tabular-nums outline-none placeholder:text-muted-foreground/30"
              {...montoInicialField}
              onChange={(e) => {
                e.target.value = sanitizarNumeroNoNegativo(e.target.value)
                montoInicialField.onChange(e)
              }}
            />
          </div>
          {errors.monto_inicial && (
            <p role="alert" className="text-sm text-destructive">
              {errors.monto_inicial.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
            <span>Cuenta el fondo antes de capturarlo.</span>
            {limiteEfectivo != null && <span>Máx. {formatCurrency(limiteEfectivo)}</span>}
          </div>
          {montosRapidos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {montosRapidos.map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => setValue('monto_inicial', monto)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  {formatCurrency(monto)}
                </button>
              ))}
            </div>
          )}
        </div>

        {abrir.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getApiErrorMessage(abrir.error, 'No se pudo abrir la caja')}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" className="h-11 px-8 text-base" disabled={abrir.isPending}>
            {abrir.isPending ? 'Iniciando...' : 'Iniciar turno'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 px-6 text-base"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Cerrar sesión
          </Button>
        </div>
        {logout.isError && (
          <p className="text-xs text-destructive">{getApiErrorMessage(logout.error, 'No se pudo cerrar sesión')}</p>
        )}
      </form>
    </SplitBrandScreen>
  )
}
