import { Routes, Route, Navigate } from "react-router-dom";

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
import useUser from "./hooks/useUser";
import PageLicencia from "./pages/PageLicencia";
import PageMoveStock from './entities/movimiento-stock/Page'
import MovimientoStockCreate from "./entities/movimiento-stock/movimientoStockCreate";
import MovimientoStockView from "./entities/movimiento-stock/movimientoStockView";
import PageIngredientes from "./entities/ingredientes/Page";
import PagePlatos from "./entities/platos/Page";

export default function App() {
  const { expired } = useUser();

  if (expired) return <PageLicencia />

  return (
    <Routes>
      <Route path="/crud/:entity/:mode/:id?" element={<CrudFormPage />} />
      <Route path="/detail/:entity/:id" element={<SaleDetail />} />
      <Route path="/ventas/create" element={<VentaCreate />} />
      <Route path="/ventas/:idVenta" element={<SaleDetail />} />
      <Route path="/movimiento-stock/create" element={<MovimientoStockCreate />} />
      <Route path="/movimiento-stock/:id" element={<MovimientoStockView />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<PageHome />} />
        <Route path="/clientes" element={<PageClientes />} />
        <Route path="/productos" element={<PageProductos />} />
        <Route path="/metodos-pago" element={<PageMetodoPago />} />
        <Route path="/ventas" element={<PageVentas />} />
        <Route path="/resumenes" element={<PageResumen />} />
        <Route path="/caja" element={<PageCaja />} />
        <Route path="/vendedores" element={<PageVendedores />} />
        <Route path="/movimientos-stock" element={<PageMoveStock />} />
        <Route path="/ingredientes" element={<PageIngredientes />} />
        <Route path="/platos" element={<PagePlatos />} />
      </Route>
      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
