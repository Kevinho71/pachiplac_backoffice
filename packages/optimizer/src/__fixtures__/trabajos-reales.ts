import type { Bordes, HojaDisponible, PiezaEntrada } from '../types'

export interface TrabajoReal {
  nombre: string
  material: string
  /**
   * Datos provisionales: reemplazar por los trabajos que el dueño ya cortó con
   * SketchCut (lista de piezas + hojas gastadas) para comparar de verdad.
   */
  nota: string
  hojas: HojaDisponible[]
  piezas: PiezaEntrada[]
  /** Medias hojas que gastó el dueño en el trabajo real. */
  mediasReales: number
}

export const MELAMINA_2750x1830: HojaDisponible = {
  tipo: 'ENTERA',
  largo: 2750,
  ancho: 1830,
  costoMedias: 2,
}

export const VENESTA_2440x1220: HojaDisponible = {
  tipo: 'ENTERA',
  largo: 2440,
  ancho: 1220,
  costoMedias: 2,
}

function pieza(
  id: string,
  etiqueta: string,
  largo: number,
  ancho: number,
  cantidad: number,
  bordes: Bordes = {},
): PiezaEntrada {
  return { id, etiqueta, largo, ancho, cantidad, puedeRotar: true, bordes }
}

export const TRABAJOS: TrabajoReal[] = [
  {
    nombre: 'Alacena de cocina',
    material: 'Melamina blanca 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 2,
    piezas: [
      pieza('laterales', 'Lateral', 720, 350, 2, { sup: 'Blanco' }),
      pieza('piso', 'Piso', 564, 350, 1, { sup: 'Blanco', inf: 'Blanco' }),
      pieza('techo', 'Techo', 564, 350, 1, { sup: 'Blanco', inf: 'Blanco' }),
      pieza('puertas', 'Puerta', 700, 330, 2, {
        sup: 'Blanco',
        inf: 'Blanco',
        izq: 'Blanco',
        der: 'Blanco',
      }),
      pieza('estantes', 'Estante', 560, 330, 4, { sup: 'Blanco' }),
    ],
  },
  {
    nombre: 'Placard 2 puertas',
    material: 'Melamina roble 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 6,
    piezas: [
      pieza('laterales', 'Lateral', 2400, 600, 2, { sup: 'Roble' }),
      pieza('piso-techo', 'Piso/Techo', 1200, 600, 2, { sup: 'Roble' }),
      pieza('estantes', 'Estante', 1200, 500, 4, { sup: 'Roble' }),
      pieza('puertas', 'Puerta', 2400, 550, 2, {
        sup: 'Roble',
        inf: 'Roble',
        izq: 'Roble',
        der: 'Roble',
      }),
    ],
  },
  {
    nombre: 'Mueble de TV',
    material: 'Melamina wengué 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 2,
    piezas: [
      pieza('base', 'Base', 1800, 400, 1, { sup: 'Wengué' }),
      pieza('laterales', 'Lateral', 400, 350, 2, { sup: 'Wengué' }),
      pieza('frente', 'Frente', 1800, 300, 1, { sup: 'Wengué', inf: 'Wengué' }),
      pieza('puertas', 'Puerta', 600, 350, 2, {
        sup: 'Wengué',
        inf: 'Wengué',
        izq: 'Wengué',
        der: 'Wengué',
      }),
      pieza('estantes', 'Estante', 1100, 300, 2, { sup: 'Wengué' }),
    ],
  },
  {
    nombre: 'Escritorio',
    material: 'Melamina gris 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 2,
    piezas: [
      pieza('tablero', 'Tablero', 1500, 700, 1, {
        sup: 'Gris',
        inf: 'Gris',
        izq: 'Gris',
        der: 'Gris',
      }),
      pieza('laterales', 'Lateral', 700, 400, 2, { sup: 'Gris' }),
      pieza('falda', 'Falda', 1400, 300, 1, { sup: 'Gris', inf: 'Gris' }),
      pieza('estante', 'Estante', 1200, 250, 1, { sup: 'Gris' }),
    ],
  },
  {
    nombre: 'Biblioteca',
    material: 'Melamina blanca 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 2,
    piezas: [
      pieza('laterales', 'Lateral', 2000, 300, 2, { sup: 'Blanco' }),
      pieza('estantes', 'Estante', 900, 300, 5, { sup: 'Blanco' }),
      pieza('puertas', 'Puerta', 900, 400, 2, {
        sup: 'Blanco',
        inf: 'Blanco',
        izq: 'Blanco',
        der: 'Blanco',
      }),
    ],
  },
  {
    nombre: 'Cocina completa',
    material: 'Melamina blanca 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [MELAMINA_2750x1830],
    mediasReales: 4,
    piezas: [
      pieza('laterales', 'Lateral', 700, 560, 4, { sup: 'Blanco' }),
      pieza('estantes', 'Estante', 560, 400, 4, { sup: 'Blanco' }),
      pieza('puertas', 'Puerta', 700, 400, 4, {
        sup: 'Blanco',
        inf: 'Blanco',
        izq: 'Blanco',
        der: 'Blanco',
      }),
      pieza('cajones', 'Frente de cajón', 900, 560, 2, {
        sup: 'Blanco',
        inf: 'Blanco',
        izq: 'Blanco',
        der: 'Blanco',
      }),
    ],
  },
  {
    nombre: 'Placard 3 cuerpos (venesta)',
    material: 'Venesta 18 mm',
    nota: 'Provisional. Reemplazar por un trabajo real del dueño.',
    hojas: [VENESTA_2440x1220],
    mediasReales: 18,
    piezas: [
      pieza('laterales', 'Lateral', 2300, 560, 6, { sup: 'Natural' }),
      pieza('estantes', 'Estante', 1180, 500, 9, { sup: 'Natural' }),
      pieza('puertas', 'Puerta', 2300, 400, 3, {
        sup: 'Natural',
        inf: 'Natural',
        izq: 'Natural',
        der: 'Natural',
      }),
      pieza('fondos', 'Fondo', 1180, 560, 3, { sup: 'Natural' }),
    ],
  },
]
