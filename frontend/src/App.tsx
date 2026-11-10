import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { RutaProtegida } from './components/layout/RutaProtegida'
import { LoginPage } from './features/auth/LoginPage'
import { ProductoFormPage } from './features/catalogo/ProductoFormPage'
import { ProductosPage } from './features/catalogo/ProductosPage'
import { PreciosPage } from './features/catalogo/PreciosPage'
import { EditorPage } from './features/editor/components/EditorPage'
import { InventarioPage } from './features/inventario/InventarioPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RutaProtegida />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/editor" replace />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/productos/nuevo" element={<ProductoFormPage />} />
              <Route path="/productos/:id" element={<ProductoFormPage />} />
              <Route path="/productos/:id/precios" element={<PreciosPage />} />
              <Route path="/inventario" element={<InventarioPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/editor" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
