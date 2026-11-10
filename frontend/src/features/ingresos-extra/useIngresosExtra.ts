import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { useSucursalId } from '@/features/catalogo/useCatalogo'
import type {
  ActualizarIngresoExtraPayload,
  CrearIngresoExtraPayload,
  FiltrosIngresosExtra,
  IngresoExtra,
} from './tipos'

function invalidarIngresos(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['ingresos-extra'] })
}

export function useIngresosExtra(filtros: FiltrosIngresosExtra = {}) {
  const sucursalId = useSucursalId()
  return useQuery<IngresoExtra[]>({
    queryKey: ['ingresos-extra', sucursalId, filtros],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filtros.desde) params.set('desde', filtros.desde)
      if (filtros.hasta) params.set('hasta', filtros.hasta)
      if (filtros.q?.trim()) params.set('q', filtros.q.trim())
      const query = params.toString()
      return api<IngresoExtra[]>(`/ingresos-extra${query ? `?${query}` : ''}`)
    },
    enabled: sucursalId !== null,
  })
}

export function useCrearIngresoExtra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CrearIngresoExtraPayload) =>
      api<IngresoExtra>('/ingresos-extra', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidarIngresos(queryClient),
  })
}

export function useActualizarIngresoExtra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActualizarIngresoExtraPayload }) =>
      api<IngresoExtra>(`/ingresos-extra/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidarIngresos(queryClient),
  })
}

export function useEliminarIngresoExtra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<{ ok: true }>(`/ingresos-extra/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidarIngresos(queryClient),
  })
}
