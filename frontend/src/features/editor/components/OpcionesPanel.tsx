import type { ModoCorte, PrimerCorte } from '@pachiplac/optimizer'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useEditor } from '../editor.store'

const PRESETS_HOJA: ReadonlyArray<{ nombre: string; largo: number; ancho: number }> = [
  { nombre: 'Melamina 2750 × 1830', largo: 2750, ancho: 1830 },
  { nombre: 'Melamina 2750 × 1850', largo: 2750, ancho: 1850 },
  { nombre: 'Ventas 2440 × 1220', largo: 2440, ancho: 1220 },
]

const MODOS: ReadonlyArray<{ valor: ModoCorte; etiqueta: string }> = [
  { valor: 'GUILLOTINA_LIBRE', etiqueta: 'Guillotina libre (aprovecha más)' },
  { valor: 'DOS_ETAPAS', etiqueta: 'Dos etapas (más simple en la sierra)' },
]

const PRIMEROS_CORTES: ReadonlyArray<{ valor: PrimerCorte; etiqueta: string }> = [
  { valor: 'AUTO', etiqueta: 'Automático' },
  { valor: 'VERTICAL', etiqueta: 'Vertical primero' },
  { valor: 'HORIZONTAL', etiqueta: 'Horizontal primero' },
]

const TIEMPOS: ReadonlyArray<number> = [500, 1200, 2500, 5000]

export function OpcionesPanel() {
  const opciones = useEditor((state) => state.opciones)
  const setOpcion = useEditor((state) => state.setOpcion)

  const presetActual =
    PRESETS_HOJA.find(
      (preset) => preset.largo === opciones.hojaLargoMm && preset.ancho === opciones.hojaAnchoMm,
    )?.nombre ?? 'Personalizada'

  const refiladoActivo = opciones.refiladoMm > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros de corte</CardTitle>
        <CardDescription>Hoja, sierra y búsqueda. Se aplican al optimizar.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={opciones.material}
            maxLength={60}
            onChange={(event) => setOpcion('material', event.target.value)}
            placeholder="Ej. Melamina roble 18 mm"
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="preset-hoja">Medida de hoja</Label>
          <Select
            id="preset-hoja"
            value={presetActual}
            onChange={(event) => {
              const preset = PRESETS_HOJA.find((item) => item.nombre === event.target.value)
              if (!preset) return
              setOpcion('hojaLargoMm', preset.largo)
              setOpcion('hojaAnchoMm', preset.ancho)
            }}
          >
            {PRESETS_HOJA.map((preset) => (
              <option key={preset.nombre} value={preset.nombre}>
                {preset.nombre}
              </option>
            ))}
            <option value="Personalizada">Personalizada</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoNumero
            id="hoja-largo"
            etiqueta="Largo hoja"
            sufijo="mm"
            valor={opciones.hojaLargoMm}
            onChange={(valor) => setOpcion('hojaLargoMm', valor)}
          />
          <CampoNumero
            id="hoja-ancho"
            etiqueta="Ancho hoja"
            sufijo="mm"
            valor={opciones.hojaAnchoMm}
            onChange={(valor) => setOpcion('hojaAnchoMm', valor)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CampoNumero
            id="kerf"
            etiqueta="Kerf (sierra)"
            sufijo="mm"
            valor={opciones.kerf}
            onChange={(valor) => setOpcion('kerf', valor)}
          />
          <CampoNumero
            id="refilado"
            etiqueta="Margen por lado"
            sufijo="mm"
            valor={opciones.refiladoMm}
            min={0}
            disabled={!refiladoActivo}
            onChange={(valor) => setOpcion('refiladoMm', valor)}
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={refiladoActivo}
            onChange={(event) => setOpcion('refiladoMm', event.target.checked ? 5 : 0)}
          />
          <span>
            Refilar bordes dañados
            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
              {refiladoActivo
                ? `Se recortan ${opciones.refiladoMm} mm de cada borde (${opciones.refiladoMm * 2} mm por dimensión).`
                : 'Sin refilar: se usa el borde tal como viene.'}
            </span>
          </span>
        </label>

        <div className="grid gap-1.5">
          <Label htmlFor="modo">Modo de corte</Label>
          <Select
            id="modo"
            value={opciones.modoCorte}
            onChange={(event) => setOpcion('modoCorte', event.target.value as ModoCorte)}
          >
            {MODOS.map((modo) => (
              <option key={modo.valor} value={modo.valor}>
                {modo.etiqueta}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="primer-corte">Primer corte</Label>
          <Select
            id="primer-corte"
            value={opciones.primerCorte}
            onChange={(event) => setOpcion('primerCorte', event.target.value as PrimerCorte)}
          >
            {PRIMEROS_CORTES.map((corte) => (
              <option key={corte.valor} value={corte.valor}>
                {corte.etiqueta}
              </option>
            ))}
          </Select>
        </div>

        <details className="rounded-md border border-border bg-background/60 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
            Opciones avanzadas
          </summary>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tiempo">Tiempo de búsqueda</Label>
              <Select
                id="tiempo"
                value={String(opciones.tiempoMaxMs)}
                onChange={(event) => setOpcion('tiempoMaxMs', Number(event.target.value))}
              >
                {TIEMPOS.map((tiempo) => (
                  <option key={tiempo} value={tiempo}>
                    {tiempo} ms
                  </option>
                ))}
              </Select>
            </div>
            <CampoNumero
              id="semilla"
              etiqueta="Semilla (reproducibilidad)"
              valor={opciones.semilla}
              onChange={(valor) => setOpcion('semilla', valor)}
            />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

interface CampoNumeroProps {
  id: string
  etiqueta: string
  sufijo?: string
  valor: number
  min?: number
  disabled?: boolean
  onChange: (valor: number) => void
}

function CampoNumero({ id, etiqueta, sufijo, valor, min, disabled, onChange }: CampoNumeroProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          disabled={disabled}
          value={Number.isFinite(valor) ? valor : ''}
          onChange={(event) => onChange(Number(event.target.value))}
          className={sufijo ? 'pr-9 text-right tabular' : 'text-right tabular'}
        />
        {sufijo ? (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
            {sufijo}
          </span>
        ) : null}
      </div>
    </div>
  )
}
