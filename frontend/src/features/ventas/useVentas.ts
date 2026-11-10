import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useSucursalId } from '@/features/catalogo/useCatalogo'
import type {
  CrearVentaPayload,
  DocumentoImpresion,
  FiltrosVentas,
  VentaDetalle,
  VentaResumen,
} from './tipos'

function invalidarVentas(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['ventas'] })
  void queryClient.invalidateQueries({ queryKey: ['venta'] })
  void queryClient.invalidateQueries({ queryKey: ['stock'] })
  void queryClient.invalidateQueries({ queryKey: ['productos'] })
}

export function useVentas(filtros: FiltrosVentas = {}) {
  const sucursalId = useSucursalId()
  return useQuery<VentaResumen[]>({
    queryKey: ['ventas', sucursalId, filtros],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filtros.desde) params.set('desde', filtros.desde)
      if (filtros.hasta) params.set('hasta', filtros.hasta)
      if (filtros.esFactura !== undefined) params.set('esFactura', String(filtros.esFactura))
      if (filtros.pendientes !== undefined) params.set('pendientes', String(filtros.pendientes))
      if (filtros.entregado !== undefined) params.set('entregado', String(filtros.entregado))
      if (filtros.clienteId) params.set('clienteId', String(filtros.clienteId))
      const query = params.toString()
      return api<VentaResumen[]>(`/ventas${query ? `?${query}` : ''}`)
    },
    enabled: sucursalId !== null,
  })
}

export function useVenta(ordenVenta: number | null) {
  const sucursalId = useSucursalId()
  return useQuery<VentaDetalle>({
    queryKey: ['venta', sucursalId, ordenVenta],
    queryFn: () => api<VentaDetalle>(`/ventas/${ordenVenta}`),
    enabled: sucursalId !== null && ordenVenta !== null,
  })
}

export function useCrearVenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearVentaPayload) =>
      api<VentaDetalle>('/ventas', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => invalidarVentas(queryClient),
  })
}

export function useActualizarSaldo(ordenVenta: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { abono?: string; saldo?: string }) =>
      api<VentaDetalle>(`/ventas/${ordenVenta}/saldo`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidarVentas(queryClient),
  })
}

export function useActualizarEntregado(ordenVenta: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entregado: boolean) =>
      api<VentaDetalle>(`/ventas/${ordenVenta}/entregado`, {
        method: 'PATCH',
        body: JSON.stringify({ entregado }),
      }),
    onSuccess: () => invalidarVentas(queryClient),
  })
}

export function useActualizarEsquema(ordenVenta: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (esquema: VentaDetalle['esquema']) =>
      api<VentaDetalle>(`/ventas/${ordenVenta}/esquema`, {
        method: 'PUT',
        body: JSON.stringify({ esquema }),
      }),
    onSuccess: () => invalidarVentas(queryClient),
  })
}

export function useDocumentoImpresion(
  ordenVenta: number | null,
  tipo: 'NOTA' | 'PEDIDO',
  enabled = true,
) {
  const sucursalId = useSucursalId()
  return useQuery<DocumentoImpresion>({
    queryKey: ['venta-impresion', sucursalId, ordenVenta, tipo],
    queryFn: () => api<DocumentoImpresion>(`/ventas/${ordenVenta}/imprimir?tipo=${tipo}`),
    enabled: sucursalId !== null && ordenVenta !== null && enabled,
  })
}
