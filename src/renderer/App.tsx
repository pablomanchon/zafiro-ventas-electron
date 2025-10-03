import { Routes, Route } from "react-router-dom";
import PageHome from "./pages/PageHome";
import PageClientes from "./entities/clientes/Page";
import PageProductos from "./entities/productos/Page";
import PageMetodoPago from "./entities/metodo-pago/Page";
import PageVentas from "./entities/ventas/Page";
import CrudFormPage from "./pages/CrudFormPage";
import MainLayout from "./layout/MainWithNav";
import VentaCreate from "./entities/ventas/VentaCreate";
import PageResumen from "./entities/resumen/Page";
import PageCaja from "./entities/caja/Page";
import SaleDetail from "./entities/ventas/Detail";
import PageVendedores from "./entities/vendedores/Page";

export default function App() {

  return (
    <Routes>
      {/* 1) Rutas standalone sin Navbar/Panel */}
      <Route path="/crud/:entity/:mode/:id?" element={<CrudFormPage />} />
      <Route path="/detail/:entity/:id" element={<SaleDetail />} />
      <Route path="/ventas/create" element={<VentaCreate />} />
      <Route path="/ventas/:idVenta" element={<VentaCreate />} />

      {/* 2) Rutas normales bajo MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<PageHome />} />
        <Route path="/clientes" element={<PageClientes />} />
        <Route path="/productos" element={<PageProductos />} />
        <Route path="/metodos-pago" element={<PageMetodoPago />} />
        <Route path="/ventas" element={<PageVentas />} />
        <Route path="/resumenes" element={<PageResumen />} />
        <Route path="/caja" element={<PageCaja/>}/>
        <Route path="/vendedores" element={<PageVendedores/>}/>
      </Route>
    </Routes>
  )
}