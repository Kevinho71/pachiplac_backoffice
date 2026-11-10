import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'

import { loginInputSchema, type LoginInput } from '@pachiplac/shared'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { Marca } from '@/components/layout/Marca'
import { useLogin, useSesion } from './useSesion'

export function LoginPage() {
  const navigate = useNavigate()
  const sesion = useSesion()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
    defaultValues: { email: '', password: '' },
  })

  if (sesion.data) {
    return <Navigate to="/editor" replace />
  }

  const onSubmit = (values: LoginInput): void => {
    login.mutate(values, {
      onSuccess: () => {
        void navigate('/editor', { replace: true })
      },
    })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <Marca />
        <div>
          <p className="text-3xl font-semibold leading-tight">
            El taller,
            <br />
            ordenado.
          </p>
          <p className="mt-3 max-w-sm text-sm text-background/65">
            Cortes, catálogo, precios e inventario por sucursal en un solo lugar.
          </p>
        </div>
        <EsquemaDecorativo />
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Marca />
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">Ingresar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usuario dueño de PACHIPLAC. Después elegís la sucursal.
          </p>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event)
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@pachiplac.com"
                {...register('email')}
              />
              {errors.email ? (
                <span className="text-[11px] text-negative">{errors.email.message}</span>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password ? (
                <span className="text-[11px] text-negative">{errors.password.message}</span>
              ) : null}
            </div>

            {login.error ? (
              <Alert variant="destructive">
                <AlertDescription className="text-negative/90">
                  {login.error instanceof ApiError
                    ? login.error.message
                    : 'No se pudo iniciar sesión.'}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="mt-1 h-10" disabled={login.isPending}>
              {login.isPending ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : null}
              Entrar
            </Button>
          </form>

          {import.meta.env.DEV ? (
            <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
              Desarrollo: <span className="font-medium text-foreground">admin@pachiplac.com</span>{' '}
              / <span className="font-medium text-foreground">cambiar123</span>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  )
}

/** Esquema de cortes decorativo del panel de marca. */
function EsquemaDecorativo() {
  return (
    <svg viewBox="0 0 420 220" className="h-auto w-full text-background/25" aria-hidden="true">
      <rect x="1" y="1" width="418" height="218" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="150" y1="1" x2="150" y2="219" stroke="currentColor" strokeDasharray="6 5" strokeWidth="1" />
      <line x1="285" y1="1" x2="285" y2="219" stroke="currentColor" strokeDasharray="6 5" strokeWidth="1" />
      <line x1="1" y1="120" x2="150" y2="120" stroke="currentColor" strokeDasharray="6 5" strokeWidth="1" />
      <line x1="285" y1="70" x2="419" y2="70" stroke="currentColor" strokeDasharray="6 5" strokeWidth="1" />
      <rect x="18" y="18" width="114" height="84" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
      <rect x="18" y="138" width="114" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="168" y="18" width="99" height="184" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="303" y="88" width="98" height="114" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
