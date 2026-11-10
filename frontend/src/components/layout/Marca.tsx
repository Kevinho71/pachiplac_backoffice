import { cn } from '@/lib/utils'

interface MarcaProps {
  className?: string
  /** Oculta el subtítulo ("Editor de cortes") cuando se usa compacta. */
  compacta?: boolean
}

/** Marca del producto: una lámina con dos cortes, dibujada (no un cuadrado con letra). */
export function Marca({ className, compacta = false }: MarcaProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="shrink-0 text-current"
      >
        <rect
          x="2.5"
          y="2.5"
          width="23"
          height="23"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line x1="2.5" y1="17" x2="25.5" y2="17" stroke="var(--primary)" strokeWidth="1.6" />
        <line x1="17" y1="2.5" x2="17" y2="17" stroke="var(--primary)" strokeWidth="1.6" />
      </svg>
      <div className="leading-none">
        <div className="text-sm font-semibold tracking-tight">PACHIPLAC</div>
        {!compacta ? (
          <div className="mt-0.5 text-[11px] opacity-60">Cortes e inventario</div>
        ) : null}
      </div>
    </div>
  )
}
