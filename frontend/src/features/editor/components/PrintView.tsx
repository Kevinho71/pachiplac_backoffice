import { colorDeCinta } from '../cinta-colores'
import { metrosDeHoja } from '../cinta-hoja'
import { formatearDimensiones, formatearMetros, TIPO_HOJA_LABEL } from '../constantes'
import { useEditor } from '../editor.store'
import { EsquemaSvg } from './EsquemaSvg'

/**
 * Vista de impresión: una página por hoja, con material, secuencia de cortes,
 * cinta por color y el espacio para el sello de CANCELADO.
 */
export function PrintView() {
  const resultado = useEditor((state) => state.resultado?.resultado)
  const opciones = useEditor((state) => state.opciones)

  if (!resultado || resultado.hojas.length === 0) return null

  const total = resultado.hojas.length

  return (
    <div className="print-only text-black">
      {resultado.hojas.map((hoja, indice) => {
        const metros = metrosDeHoja(hoja)
        const colores = Object.entries(metros.porColor)

        return (
          <section key={`${hoja.tipo}-${indice}`} className="print-page print-sheet mb-6">
            <header className="mb-2 flex items-end justify-between border-b-2 border-black pb-2">
              <div>
                <p className="text-base font-semibold">PACHIPLAC · Pedido de corte</p>
                <p className="text-sm">{opciones.material || 'Material sin nombre'}</p>
              </div>
              <div className="text-right text-[11px]">
                <p className="text-sm font-semibold">
                  Hoja {indice + 1} de {total}
                </p>
                <p>
                  {TIPO_HOJA_LABEL[hoja.tipo]} · {formatearDimensiones(hoja.largo, hoja.ancho)}
                </p>
                <p>
                  Kerf {opciones.kerf} mm · Refilado {opciones.refiladoMm} mm
                </p>
              </div>
            </header>

            <div className="grid grid-cols-[1fr_190px] gap-4">
              <div className="border border-black p-1">
                <EsquemaSvg
                  hoja={hoja}
                  refiladoMm={opciones.refiladoMm}
                  mostrarCortes
                  mostrarEtiquetas
                  titulo={`Hoja ${indice + 1} de ${total}`}
                />
              </div>

              <aside className="flex flex-col gap-3 text-[11px]">
                <div>
                  <p className="mb-1 font-semibold">Cinta de canto</p>
                  {colores.length > 0 ? (
                    colores.map(([nombre, cantidad]) => {
                      const color = colorDeCinta(nombre)
                      return (
                        <p key={nombre} className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-black"
                              style={{ backgroundColor: color.hex }}
                            />
                            {nombre}
                          </span>
                          <span className="tabular">{formatearMetros(cantidad)}</span>
                        </p>
                      )
                    })
                  ) : (
                    <p>Sin cinta</p>
                  )}
                  <p className="mt-1 flex justify-between border-t border-black pt-1 font-semibold">
                    <span>Total</span>
                    <span className="tabular">{formatearMetros(metros.total)}</span>
                  </p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Corte</p>
                  <p>{hoja.cortes.length} cortes numerados</p>
                  <p>Aprovechamiento {(hoja.aprovechamiento * 100).toFixed(1)}%</p>
                  <p>
                    Retazo mayor{' '}
                    {hoja.retazoMayor.w > 0 && hoja.retazoMayor.h > 0
                      ? formatearDimensiones(hoja.retazoMayor.w, hoja.retazoMayor.h)
                      : '—'}
                  </p>
                </div>

                <div className="mt-auto flex h-24 flex-col items-center justify-center border border-black text-center">
                  <p className="text-[9px] tracking-wide">SELLO</p>
                  <p className="text-sm font-semibold tracking-widest">CANCELADO</p>
                </div>

                <p className="text-[9px] leading-snug">
                  Los sobrantes se entregan al cliente salvo indicación contraria.
                </p>
              </aside>
            </div>
          </section>
        )
      })}
    </div>
  )
}
