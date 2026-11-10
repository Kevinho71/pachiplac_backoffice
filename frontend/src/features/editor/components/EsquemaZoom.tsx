import {
  useCallback,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Maximize2, Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EsquemaSvg } from './EsquemaSvg'

type EsquemaZoomProps = ComponentProps<typeof EsquemaSvg>

interface Vista {
  escala: number
  x: number
  y: number
}

const ESCALA_MIN = 1
const ESCALA_MAX = 5
const VISTA_INICIAL: Vista = { escala: 1, x: 0, y: 0 }

function distancia(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function centro(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor))
}

/**
 * Envoltorio táctil del esquema: arrastre con un dedo (o mouse) cuando está
 * ampliado, pellizco de dos dedos para zoom y doble toque para restablecer.
 * En impresión el lienzo vuelve a su transformación original.
 */
export function EsquemaZoom({ className, ...props }: EsquemaZoomProps) {
  const contenedor = useRef<HTMLDivElement>(null)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const distanciaAnterior = useRef<number | null>(null)
  const centroAnterior = useRef<{ x: number; y: number } | null>(null)
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL)
  const vistaRef = useRef<Vista>(VISTA_INICIAL)
  const [arrastrando, setArrastrando] = useState(false)

  const aplicarVista = useCallback((nueva: Vista) => {
    const rect = contenedor.current?.getBoundingClientRect()
    const escala = limitar(nueva.escala, ESCALA_MIN, ESCALA_MAX)
    const maxX = rect ? ((escala - 1) * rect.width) / 2 : 0
    const maxY = rect ? ((escala - 1) * rect.height) / 2 : 0
    const resultado = {
      escala,
      x: limitar(nueva.x, -maxX, maxX),
      y: limitar(nueva.y, -maxY, maxY),
    }
    vistaRef.current = resultado
    setVista(resultado)
  }, [])

  const acercar = (): void => {
    const actual = vistaRef.current
    aplicarVista({ ...actual, escala: Math.min(ESCALA_MAX, actual.escala + 0.5) })
  }

  const alejar = (): void => {
    const actual = vistaRef.current
    aplicarVista({ ...actual, escala: Math.max(ESCALA_MIN, actual.escala - 0.5) })
  }

  const restablecer = (): void => {
    distanciaAnterior.current = null
    centroAnterior.current = null
    vistaRef.current = VISTA_INICIAL
    setVista(VISTA_INICIAL)
  }

  const alPresionar = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    punteros.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (punteros.current.size === 1) {
      distanciaAnterior.current = null
      centroAnterior.current = null
      setArrastrando(true)
    } else if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()]
      if (a && b) {
        distanciaAnterior.current = distancia(a, b)
        centroAnterior.current = centro(a, b)
      }
    }
  }

  const alMover = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!punteros.current.has(event.pointerId)) return
    const anterior = punteros.current.get(event.pointerId)
    punteros.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const activos = [...punteros.current.values()]
    if (activos.length >= 2) {
      const [a, b] = activos
      if (!a || !b) return
      const actual = distancia(a, b)
      const centroActual = centro(a, b)
      const previa = distanciaAnterior.current
      const centroPrevio = centroAnterior.current

      if (previa && previa > 0) {
        const factor = actual / previa
        const actualVista = vistaRef.current
        const escala = limitar(actualVista.escala * factor, ESCALA_MIN, ESCALA_MAX)
        const desplazamientoX = centroPrevio ? centroActual.x - centroPrevio.x : 0
        const desplazamientoY = centroPrevio ? centroActual.y - centroPrevio.y : 0
        aplicarVista({
          escala,
          x: actualVista.x + desplazamientoX,
          y: actualVista.y + desplazamientoY,
        })
      }

      distanciaAnterior.current = actual
      centroAnterior.current = centroActual
      return
    }

    if (activos.length === 1 && anterior && vistaRef.current.escala > ESCALA_MIN) {
      const dx = event.clientX - anterior.x
      const dy = event.clientY - anterior.y
      aplicarVista({
        ...vistaRef.current,
        x: vistaRef.current.x + dx,
        y: vistaRef.current.y + dy,
      })
    }
  }

  const alSoltar = (event: ReactPointerEvent<HTMLDivElement>): void => {
    punteros.current.delete(event.pointerId)
    distanciaAnterior.current = null
    centroAnterior.current = null
    if (punteros.current.size === 0) {
      setArrastrando(false)
    }
  }

  return (
    <div
      ref={contenedor}
      className={cn(
        'relative overflow-hidden rounded-sm bg-background/40 select-none',
        className,
      )}
      style={{ touchAction: vista.escala > ESCALA_MIN ? 'none' : 'pan-y' }}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onDoubleClick={restablecer}
      role="group"
      aria-label="Esquema de corte con zoom y arrastre"
    >
      <div
        className="esquema-zoom__lienzo origin-center will-change-transform"
        style={{
          transform: `translate3d(${vista.x}px, ${vista.y}px, 0) scale(${vista.escala})`,
          transition: arrastrando ? 'none' : 'transform 140ms ease-out',
          cursor: vista.escala > ESCALA_MIN ? (arrastrando ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <EsquemaSvg {...props} className="pointer-events-none" />
      </div>

      <div
        className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md border border-border/80 bg-card/90 p-1 shadow-sm backdrop-blur"
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Alejar esquema"
          title="Alejar"
          onClick={alejar}
          disabled={vista.escala === ESCALA_MIN}
        >
          <Minus aria-hidden="true" className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Restablecer zoom"
          title="Restablecer"
          onClick={restablecer}
        >
          <Maximize2 aria-hidden="true" className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Acercar esquema"
          title="Acercar"
          onClick={acercar}
          disabled={vista.escala === ESCALA_MAX}
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="pointer-events-none absolute bottom-1 left-2 text-[10px] text-muted-foreground/80">
        Pellizcá o usá + / − para ampliar
      </p>
    </div>
  )
}
