import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ClienteInput, ClienteUpdate } from '@pachiplac/shared'

import { api } from '@/lib/api'
import { useSucursalId } from '@/features/catalogo/useCatalogo'
import type { ClienteListado } from './tipos'

export function useClientes(q = '') {
  const sucursalId = useSucursalId()
  return useQuery<ClienteListado[]>({
    queryKey: ['clientes', sucursalId, q],
    queryFn: () => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const query = params.toString()
      return api<ClienteListado[]>(`/clientes${query ? `?${query}` : ''}`)
    },
    enabled: sucursalId !== null,
  })
}

export function useCrearCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClienteInput) =>
      api<ClienteListado>('/clientes', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useActualizarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClienteUpdate }) =>
      api<ClienteListado>(`/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
