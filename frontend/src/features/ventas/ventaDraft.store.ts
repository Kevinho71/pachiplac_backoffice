import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type {
  EditorVentaContexto,
  ItemVentaDraft,
  SeccionEsquemaDraft,
} from './tipos'

interface VentaDraftState {
  clienteId: number | null
  fecha: string
  metodoPago: string
  esFactura: boolean
  nroFactura: string
  descuento: string
  cobrado: string
  entregado: boolean
  items: ItemVentaDraft[]
  secciones: SeccionEsquemaDraft[]
  editor: EditorVentaContexto | null

  setCampo: <K extends keyof CamposVenta>(clave: K, valor: CamposVenta[K]) => void
  addItem: (item: Omit<ItemVentaDraft, 'id'>) => void
  updateItem: (id: string, patch: Partial<Omit<ItemVentaDraft, 'id'>>) => void
  removeItem: (id: string) => void
  upsertSeccion: (seccion: SeccionEsquemaDraft) => void
  removeSeccion: (id: string) => void
  setEditor: (contexto: EditorVentaContexto | null) => void
  reset: () => void
}

type CamposVenta = Pick<
  VentaDraftState,
  | 'clienteId'
  | 'fecha'
  | 'metodoPago'
  | 'esFactura'
  | 'nroFactura'
  | 'descuento'
  | 'cobrado'
  | 'entregado'
>

function estadoInicial(): CamposVenta & {
  items: ItemVentaDraft[]
  secciones: SeccionEsquemaDraft[]
  editor: EditorVentaContexto | null
} {
  return {
    clienteId: null,
    fecha: new Date().toISOString(),
    metodoPago: 'Efectivo',
    esFactura: false,
    nroFactura: '',
    descuento: '',
    cobrado: '',
    entregado: false,
    items: [],
    secciones: [],
    editor: null,
  }
}

export const useVentaDraft = create<VentaDraftState>()(
  persist(
    (set) => ({
      ...estadoInicial(),

      setCampo: (clave, valor) => set({ [clave]: valor }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }],
        })),

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

      upsertSeccion: (seccion) =>
        set((state) => {
          const existe = state.secciones.some((actual) => actual.id === seccion.id)
          return {
            secciones: existe
              ? state.secciones.map((actual) => (actual.id === seccion.id ? seccion : actual))
              : [...state.secciones, seccion],
          }
        }),

      removeSeccion: (id) =>
        set((state) => ({ secciones: state.secciones.filter((seccion) => seccion.id !== id) })),

      setEditor: (contexto) => set({ editor: contexto }),

      reset: () => set(estadoInicial()),
    }),
    {
      name: 'pachiplac-venta-draft',
      partialize: (state) => ({
        clienteId: state.clienteId,
        fecha: state.fecha,
        metodoPago: state.metodoPago,
        esFactura: state.esFactura,
        nroFactura: state.nroFactura,
        descuento: state.descuento,
        cobrado: state.cobrado,
        entregado: state.entregado,
        items: state.items,
        secciones: state.secciones,
        editor: state.editor,
      }),
    },
  ),
)
