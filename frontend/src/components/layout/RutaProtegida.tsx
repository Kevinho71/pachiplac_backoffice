import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'

import { useSesion } from '@/features/auth/useSesion'
import { SeleccionarSucursalPage } from '@/features/auth/SeleccionarSucursalPage'

/**
 * Protege las rutas: sin sesión redirige al login; sin sucursal activa obliga a
 * elegir una antes de entrar a cualquier pantalla de datos.
 */
export function RutaProtegida() {
  const { data: sesion, isPending } = useSesion()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin text-primary" />
        Cargando sesión…
      </div>
    )
  }

  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  if (sesion.sucursalId === null) {
    return <SeleccionarSucursalPage />
  }

  return <Outlet />
}
