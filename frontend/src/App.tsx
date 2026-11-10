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
import { IngresosExtraPage } from './features/ingresos-extra/IngresosExtraPage'
import { EditarEsquemaVentaPage } from './features/ventas/EditarEsquemaVentaPage'
import { EsquemaVentaPage } from './features/ventas/EsquemaVentaPage'
import { ImpresionVentaPage } from './features/ventas/ImpresionVentaPage'
import { VentaDetallePage } from './features/ventas/VentaDetallePage'
import { VentaFormPage } from './features/ventas/VentaFormPage'
import { VentasPage } from './features/ventas/VentasPage'

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
            <Route path="/ventas/:id/imprimir" element={<ImpresionVentaPage />} />

            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/ventas" replace />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/ventas" element={<VentasPage />} />
              <Route path="/ventas/nueva" element={<VentaFormPage />} />
              <Route path="/ventas/esquema" element={<EsquemaVentaPage />} />
              <Route path="/ventas/:id" element={<VentaDetallePage />} />
              <Route path="/ventas/:id/esquema" element={<EditarEsquemaVentaPage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/productos/nuevo" element={<ProductoFormPage />} />
              <Route path="/productos/:id" element={<ProductoFormPage />} />
              <Route path="/productos/:id/precios" element={<PreciosPage />} />
              <Route path="/inventario" element={<InventarioPage />} />
              <Route path="/ingresos-extra" element={<IngresosExtraPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/ventas" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
