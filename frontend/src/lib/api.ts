const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Cliente HTTP de la app. Siempre envía la cookie de sesión (`credentials:
 * include`) y traduce los errores del backend a `ApiError`.
 */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const data = (await response.json()) as { message?: string | string[] }
      if (data.message) {
        message = Array.isArray(data.message) ? data.message.join('; ') : data.message
      }
    } catch {
      // La respuesta no era JSON; se conserva el mensaje genérico.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const texto = await response.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

export { API_URL }
