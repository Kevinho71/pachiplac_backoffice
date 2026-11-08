import { optimizar } from '../src/index'
import { TRABAJOS } from '../src/__fixtures__/trabajos-reales'

const indice = Number(process.argv[2] ?? 0)
const trabajo = TRABAJOS[indice] ?? TRABAJOS[0]

if (!trabajo) {
  console.error('No hay trabajos de ejemplo')
  process.exit(1)
}

const resultado = optimizar(trabajo.piezas, trabajo.hojas, {
  kerf: 4,
  refilado_mm: 5,
  modoCorte: 'GUILLOTINA_LIBRE',
  primerCorte: 'AUTO',
  tiempoMaxMs: 1500,
})

console.log(`\n${trabajo.nombre} — ${trabajo.material}`)
console.log(`Hojas usadas: ${resultado.hojas.length} (${resultado.totalMedias} medias)`)
console.log(`Cinta: ${resultado.metrosCinta.total} m`, resultado.metrosCinta.porColor)

for (const [i, hoja] of resultado.hojas.entries()) {
  console.log(
    `\nHoja ${i + 1}: ${hoja.tipo} ${hoja.largo}×${hoja.ancho} mm — ` +
      `${hoja.piezas.length} piezas, ${hoja.cortes.length} cortes, ` +
      `aprovechamiento ${(hoja.aprovechamiento * 100).toFixed(1)}%, ` +
      `retazo mayor ${hoja.retazoMayor.w}×${hoja.retazoMayor.h} mm`,
  )
  for (const pieza of hoja.piezas) {
    const cinta = Object.entries(pieza.bordes)
      .filter(([, color]) => Boolean(color))
      .map(([lado, color]) => `${lado}:${color}`)
      .join(' ')
    console.log(
      `  - ${pieza.etiqueta ?? pieza.idPieza}: ${pieza.w}×${pieza.h} mm en (${pieza.x}, ${pieza.y})` +
        `${pieza.rotada ? ' [rotada]' : ''}${cinta ? ` cinta ${cinta}` : ''}`,
    )
  }
  console.log(
    `  Cortes: ${hoja.cortes.map((c) => `${c.n}${c.orientacion}@${c.posicion}`).join(', ')}`,
  )
}
