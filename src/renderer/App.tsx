import { Routes, Route, Navigate } from "react-router-dom";
import useUser from "./hooks/useUser";

import MainLayout from "./layout/MainWithNav";
import PageHome from "./pages/PageHome";
import PageClientes from "./entities/clientes/Page";
import PageProductos from "./entities/productos/Page";
import PageMetodoPago from "./entities/metodo-pago/Page";
import PageVentas from "./entities/ventas/Page";
import CrudFormPage from "./pages/CrudFormPage";
import VentaCreate from "./entities/ventas/VentaCreate";
import PageResumen from "./entities/resumen/Page";
import PageCaja from "./entities/caja/Page";
import SaleDetail from "./entities/ventas/Detail";
import PageVendedores from "./entities/sellers/Page";
import PageLicencia from "./pages/PageLicencia";

export default function App() {
  const { expired, loading } = useUser();

  // 🔹 mientras carga, bloquea toda la app
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Verificando licencia...
      </div>
    );
  }

  // 🔹 si la licencia está vencida, mostrar pantalla dedicada
  if (expired) {
    return <PageLicencia />;
  }

  // 🔹 si está todo bien, renderizar normalmente
  return (
    <Routes>
      <Route path="/crud/:entity/:mode/:id?" element={<CrudFormPage />} />
      <Route path="/detail/:entity/:id" element={<SaleDetail />} />
      <Route path="/ventas/create" element={<VentaCreate />} />
      <Route path="/ventas/:idVenta" element={<SaleDetail />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<PageHome />} />
        <Route path="/clientes" element={<PageClientes />} />
        <Route path="/productos" element={<PageProductos />} />
        <Route path="/metodos-pago" element={<PageMetodoPago />} />
        <Route path="/ventas" element={<PageVentas />} />
        <Route path="/resumenes" element={<PageResumen />} />
        <Route path="/caja" element={<PageCaja />} />
        <Route path="/vendedores" element={<PageVendedores />} />
      </Route>
      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
