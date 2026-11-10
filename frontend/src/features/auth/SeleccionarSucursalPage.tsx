import { Loader2, MapPin } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Marca } from '@/components/layout/Marca'
import { useActivarSucursal, useLogout, useSucursales } from './useSesion'

/** Se muestra cuando hay sesión pero todavía no se eligió la sucursal activa. */
export function SeleccionarSucursalPage() {
  const sucursales = useSucursales()
  const activar = useActivarSucursal()
  const logout = useLogout()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Marca />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Elegí la sucursal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo, precios, inventario y ventas se filtran por la sucursal activa.
        </p>

        {sucursales.isPending ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando sucursales…
          </div>
        ) : null}

        {sucursales.isError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>No se pudieron cargar las sucursales.</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 grid gap-2">
          {sucursales.data?.map((sucursal) => (
            <button
              key={sucursal.id}
              type="button"
              disabled={activar.isPending}
              onClick={() => activar.mutate(sucursal.id)}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
            >
              <div>
                <div className="text-sm font-medium">{sucursal.nombre}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin aria-hidden="true" className="h-3 w-3" />
                  {sucursal.ciudad}
                </div>
              </div>
              {activar.isPending && activar.variables === sucursal.id ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span className="text-xs text-muted-foreground">Entrar</span>
              )}
            </button>
          ))}
        </div>

        {activar.error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>No se pudo activar la sucursal.</AlertDescription>
          </Alert>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          className="mt-6 px-0 text-muted-foreground"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
