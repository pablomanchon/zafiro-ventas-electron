import { Routes, Route } from "react-router-dom";
import PageHome from "./pages/PageHome";
import PageClientes from "./entities/clientes/Page";
import PageProductos from "./entities/productos/Page";
import PageMetodoPago from "./entities/metodo-pago/Page";
import PageVentas from "./entities/ventas/Page";
import CrudFormPage from "./pages/CrudFormPage";
import MainLayout from "./layout/MainWithNav";
import FormVenta from "./entities/ventas/form";
import PageResumen from "./entities/resumen/Page";

export default function App() {

  return (
    <Routes>
      {/* 1) Rutas standalone sin Navbar/Panel */}
      <Route path="/crud/:entity/:mode/:id?" element={<CrudFormPage />} />
      <Route path="/ventas/create" element={<FormVenta />} />
      {/* 2) Rutas normales bajo MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<PageHome />} />
        <Route path="/clientes" element={<PageClientes />} />
        <Route path="/productos" element={<PageProductos />} />
        <Route path="/metodos-pago" element={<PageMetodoPago />} />
        <Route path="/ventas" element={<PageVentas />} />
        <Route path="/resumenes" element={<PageResumen />} />
      </Route>
    </Routes>
  )
}