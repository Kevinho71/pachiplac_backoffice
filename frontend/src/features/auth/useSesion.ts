import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LoginInput } from '@pachiplac/shared'

import { ApiError, api } from '@/lib/api'
import type { LoginResponse, Sesion, Sucursal } from './tipos'

export const sesionKey = ['sesion'] as const
export const sucursalesKey = ['sucursales'] as const

/** Sesión actual; `null` si no hay cookie válida (401). */
export function useSesion() {
  return useQuery<Sesion | null>({
    queryKey: sesionKey,
    queryFn: async () => {
      try {
        return await api<Sesion>('/auth/sesion')
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null
        }
        throw error
      }
    },
    staleTime: 30_000,
    retry: false,
  })
}

export function useSucursales(enabled = true) {
  return useQuery<Sucursal[]>({
    queryKey: sucursalesKey,
    queryFn: () => api<Sucursal[]>('/sucursales'),
    enabled,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sesionKey })
      void queryClient.invalidateQueries({ queryKey: sucursalesKey })
    },
  })
}

export function useActivarSucursal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sucursalId: number) =>
      api<{ sucursalId: number }>('/sucursales/activa', {
        method: 'POST',
        body: JSON.stringify({ sucursalId }),
      }),
    onSuccess: () => {
      // Cambia el tenant: se descarta todo lo cacheado y se vuelve a pedir.
      queryClient.clear()
      void queryClient.invalidateQueries()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ ok: true }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear()
      void queryClient.invalidateQueries({ queryKey: sesionKey })
    },
  })
}
