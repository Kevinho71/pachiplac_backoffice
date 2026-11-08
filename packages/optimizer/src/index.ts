export type {
  Bordes,
  Corte,
  HojaDisponible,
  HojaResultado,
  Lado,
  ModoCorte,
  OpcionesOptimizacion,
  PiezaColocada,
  PiezaEntrada,
  PrimerCorte,
  ResultadoOptimizacion,
  Retazo,
  TipoHoja,
} from './types'

export { optimizar } from './optimizar'
export { validarHoja, type OpcionesValidacion, type ResultadoValidacion } from './validador'
export {
  generarCortes,
  esGuillotinable,
  buscarDivision,
  type Division,
  type RectPos,
} from './cortes'
export { resolverOpciones, KERF_DEFAULT, REFILADO_DEFAULT } from './opciones'
export { resolverTipos, type TipoResuelto } from './hojas'
export { expandirPiezas } from './piezas'
