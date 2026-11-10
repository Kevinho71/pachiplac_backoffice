import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useSesion } from '@/features/auth/useSesion'
import type { CompraDetalle, CrearCompraPayload, StockDetalle } from './tipos'

export function useSucursalId(): number | null {
  const { data } = useSesion()
  return data?.sucursalId ?? null
}

export function useCompras() {
  const sucursalId = useSucursalId()
  return useQuery<CompraDetalle[]>({
    queryKey: ['compras', sucursalId],
    queryFn: () => api<CompraDetalle[]>('/compras'),
    enabled: sucursalId !== null,
  })
}

export function useStock() {
  const sucursalId = useSucursalId()
  return useQuery<StockDetalle[]>({
    queryKey: ['stock', sucursalId],
    queryFn: () => api<StockDetalle[]>('/stock'),
    enabled: sucursalId !== null,
  })
}

export function useCrearCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearCompraPayload) =>
      api<CompraDetalle>('/compras', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['compras'] })
      void queryClient.invalidateQueries({ queryKey: ['stock'] })
      void queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
