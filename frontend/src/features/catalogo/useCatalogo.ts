import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PrecioHistorial } from '@pachiplac/shared'

import { api } from '@/lib/api'
import { useSesion } from '@/features/auth/useSesion'
import type {
  ActualizarProductoPayload,
  CrearProductoPayload,
  FiltrosProductos,
  ProductoDetalle,
} from './tipos'

export function useSucursalId(): number | null {
  const { data } = useSesion()
  return data?.sucursalId ?? null
}

export function useProductos(filtros: FiltrosProductos = {}) {
  const sucursalId = useSucursalId()
  return useQuery<ProductoDetalle[]>({
    queryKey: ['productos', sucursalId, filtros],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filtros.categoria) params.set('categoria', filtros.categoria)
      if (filtros.activo !== undefined) params.set('activo', String(filtros.activo))
      if (filtros.q) params.set('q', filtros.q)
      const query = params.toString()
      return api<ProductoDetalle[]>(`/productos${query ? `?${query}` : ''}`)
    },
    enabled: sucursalId !== null,
  })
}

export function useProducto(id: number | null) {
  const sucursalId = useSucursalId()
  return useQuery<ProductoDetalle>({
    queryKey: ['producto', sucursalId, id],
    queryFn: () => api<ProductoDetalle>(`/productos/${id}`),
    enabled: sucursalId !== null && id !== null,
  })
}

function invalidarCatalogo(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['productos'] })
  void queryClient.invalidateQueries({ queryKey: ['producto'] })
  void queryClient.invalidateQueries({ queryKey: ['stock'] })
}

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearProductoPayload) =>
      api<ProductoDetalle>('/productos', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidarCatalogo(queryClient),
  })
}

export function useActualizarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarProductoPayload }) =>
      api<ProductoDetalle>(`/productos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidarCatalogo(queryClient),
  })
}

export function useDesactivarProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<ProductoDetalle>(`/productos/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidarCatalogo(queryClient),
  })
}

export function usePrecios(productoId: number | null) {
  return useQuery<PrecioHistorial[]>({
    queryKey: ['precios', productoId],
    queryFn: () => api<PrecioHistorial[]>(`/productos/${productoId}/precios`),
    enabled: productoId !== null,
  })
}

export function useCrearPrecio(productoId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { precio: string }) =>
      api<PrecioHistorial>(`/productos/${productoId}/precios`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['precios', productoId] })
      invalidarCatalogo(queryClient)
    },
  })
}
