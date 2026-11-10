import { create } from 'zustand'

import { bordesAOptimizador, type Lado } from '@pachiplac/shared'
import type { PiezaEntrada } from '@pachiplac/optimizer'

import { optimizarEnWorker } from './optimizer.client'
import type {
  BordesEditor,
  EstadoOptimizacion,
  OpcionesEditor,
  PiezaEditor,
  ResultadoEditor,
} from './editor.types'
import type { PiezaFormValues } from './esquemas'

const LADOS_VACIOS: BordesEditor = { sup: null, inf: null, izq: null, der: null }

function bordesVacios(): BordesEditor {
  return { ...LADOS_VACIOS }
}

function nuevoId(): string {
  return crypto.randomUUID()
}

const OPCIONES_INICIALES: OpcionesEditor = {
  material: 'Melamina blanca 18 mm',
  hojaLargoMm: 2750,
  hojaAnchoMm: 1830,
  kerf: 4,
  refiladoMm: 5,
  modoCorte: 'GUILLOTINA_LIBRE',
  primerCorte: 'AUTO',
  tiempoMaxMs: 1200,
  semilla: 20260101,
}

/** Pedido de ejemplo: un placard chico, para que la pantalla arranque con datos reales. */
const PIEZAS_DEMO: PiezaEditor[] = [
  {
    id: nuevoId(),
    etiqueta: 'Lateral',
    largo: 1800,
    ancho: 400,
    cantidad: 2,
    puedeRotar: true,
    bordes: { ...bordesVacios(), der: 'Blanco' },
  },
  {
    id: nuevoId(),
    etiqueta: 'Estante',
    largo: 760,
    ancho: 380,
    cantidad: 4,
    puedeRotar: true,
    bordes: { ...bordesVacios(), sup: 'Blanco' },
  },
  {
    id: nuevoId(),
    etiqueta: 'Puerta',
    largo: 700,
    ancho: 350,
    cantidad: 2,
    puedeRotar: true,
    bordes: { sup: 'Blanco', inf: 'Blanco', izq: 'Blanco', der: 'Blanco' },
  },
  {
    id: nuevoId(),
    etiqueta: 'Fondo',
    largo: 1700,
    ancho: 760,
    cantidad: 1,
    puedeRotar: true,
    bordes: bordesVacios(),
  },
]

interface EditorState {
  piezas: PiezaEditor[]
  opciones: OpcionesEditor
  colorActivo: string
  estado: EstadoOptimizacion
  resultado: ResultadoEditor | null
  error: string | null

  addPieza: (values: PiezaFormValues) => void
  updatePieza: (id: string, patch: Partial<Omit<PiezaEditor, 'id'>>) => void
  setBorde: (id: string, lado: Lado, color: string | null) => void
  removePieza: (id: string) => void
  duplicarPieza: (id: string) => void
  moverPieza: (id: string, direccion: -1 | 1) => void
  setOpcion: <K extends keyof OpcionesEditor>(clave: K, valor: OpcionesEditor[K]) => void
  setColorActivo: (color: string) => void
  optimizar: () => Promise<void>
  reiniciar: () => void
}

export const useEditor = create<EditorState>()((set, get) => ({
  piezas: PIEZAS_DEMO,
  opciones: OPCIONES_INICIALES,
  colorActivo: 'Blanco',
  estado: 'inactivo',
  resultado: null,
  error: null,

  addPieza: (values) =>
    set((state) => ({
      piezas: [
        ...state.piezas,
        {
          id: nuevoId(),
          etiqueta: values.etiqueta.trim(),
          largo: values.largo,
          ancho: values.ancho,
          cantidad: values.cantidad,
          puedeRotar: values.puedeRotar,
          bordes: bordesVacios(),
        },
      ],
    })),

  updatePieza: (id, patch) =>
    set((state) => ({
      piezas: state.piezas.map((pieza) => (pieza.id === id ? { ...pieza, ...patch } : pieza)),
    })),

  setBorde: (id, lado, color) =>
    set((state) => ({
      piezas: state.piezas.map((pieza) =>
        pieza.id === id ? { ...pieza, bordes: { ...pieza.bordes, [lado]: color } } : pieza,
      ),
    })),

  removePieza: (id) =>
    set((state) => ({ piezas: state.piezas.filter((pieza) => pieza.id !== id) })),

  duplicarPieza: (id) =>
    set((state) => {
      const original = state.piezas.find((pieza) => pieza.id === id)
      if (!original) return state
      const copia: PiezaEditor = { ...original, id: nuevoId(), bordes: { ...original.bordes } }
      const indice = state.piezas.findIndex((pieza) => pieza.id === id)
      const piezas = [...state.piezas]
      piezas.splice(indice + 1, 0, copia)
      return { piezas }
    }),

  moverPieza: (id, direccion) =>
    set((state) => {
      const indice = state.piezas.findIndex((pieza) => pieza.id === id)
      const destino = indice + direccion
      if (indice < 0 || destino < 0 || destino >= state.piezas.length) return state
      const piezas = [...state.piezas]
      const [movida] = piezas.splice(indice, 1)
      if (!movida) return state
      piezas.splice(destino, 0, movida)
      return { piezas }
    }),

  setOpcion: (clave, valor) =>
    set((state) => ({ opciones: { ...state.opciones, [clave]: valor } })),

  setColorActivo: (color) => set({ colorActivo: color }),

  optimizar: async () => {
    const { piezas, opciones } = get()
    const { hojaLargoMm, hojaAnchoMm, refiladoMm } = opciones

    if (!(hojaLargoMm > 2 * refiladoMm) || !(hojaAnchoMm > 2 * refiladoMm)) {
      set({
        estado: 'error',
        error: 'Las medidas de la hoja deben superar el refilado (2 × margen por lado).',
        resultado: null,
      })
      return
    }

    const validas = piezas.filter(
      (pieza) =>
        Number.isFinite(pieza.largo) &&
        Number.isFinite(pieza.ancho) &&
        Number.isFinite(pieza.cantidad) &&
        pieza.largo > 0 &&
        pieza.ancho > 0 &&
        pieza.cantidad > 0,
    )

    if (validas.length === 0) {
      set({
        estado: 'error',
        error: 'Agregá al menos una pieza con largo, ancho y cantidad válidos.',
        resultado: null,
      })
      return
    }

    const entradas: PiezaEntrada[] = validas.map((pieza) => ({
      id: pieza.id,
      etiqueta: pieza.etiqueta.trim() || undefined,
      largo: Math.round(pieza.largo),
      ancho: Math.round(pieza.ancho),
      cantidad: Math.max(1, Math.round(pieza.cantidad)),
      puedeRotar: pieza.puedeRotar,
      bordes: bordesAOptimizador(pieza.bordes),
    }))

    set({ estado: 'calculando', error: null })

    try {
      const resultado = await optimizarEnWorker(
        entradas,
        [
          {
            tipo: 'ENTERA',
            largo: Math.round(hojaLargoMm),
            ancho: Math.round(hojaAnchoMm),
            costoMedias: 2,
          },
        ],
        {
          kerf: opciones.kerf,
          refilado_mm: opciones.refiladoMm,
          modoCorte: opciones.modoCorte,
          primerCorte: opciones.primerCorte,
          tiempoMaxMs: opciones.tiempoMaxMs,
          semilla: opciones.semilla,
        },
      )
      set({
        resultado: { resultado, calculadoEn: new Date() },
        estado: 'listo',
        error: null,
      })
    } catch (error: unknown) {
      set({
        estado: 'error',
        resultado: null,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo optimizar el corte con los datos actuales.',
      })
    }
  },

  reiniciar: () =>
    set({
      piezas: PIEZAS_DEMO.map((pieza) => ({
        ...pieza,
        id: nuevoId(),
        bordes: { ...pieza.bordes },
      })),
      opciones: { ...OPCIONES_INICIALES },
      estado: 'inactivo',
      resultado: null,
      error: null,
    }),
}))
