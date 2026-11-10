import { Boxes, LogOut, Package, Scissors } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import {
  useActivarSucursal,
  useLogout,
  useSesion,
  useSucursales,
} from '@/features/auth/useSesion'
import { cn } from '@/lib/utils'
import { Marca } from './Marca'

const NAV = [
  { to: '/editor', label: 'Editor', icon: Scissors },
  { to: '/productos', label: 'Catálogo', icon: Package },
  { to: '/inventario', label: 'Inventario', icon: Boxes },
] as const

export function AppLayout() {
  const { data: sesion } = useSesion()
  const sucursales = useSucursales()
  const activar = useActivarSucursal()
  const logout = useLogout()

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Marca compacta />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-secondary font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <Select
              aria-label="Sucursal activa"
              value={sesion?.sucursalId ?? ''}
              onChange={(event) => activar.mutate(Number(event.target.value))}
              disabled={activar.isPending || sucursales.isPending}
              className="h-8 w-auto max-w-44"
            >
              {sucursales.data?.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden"
          aria-label="Secciones"
        >
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors',
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent',
                )
              }
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 print:p-0">
        <Outlet />
      </main>
    </div>
  )
}
