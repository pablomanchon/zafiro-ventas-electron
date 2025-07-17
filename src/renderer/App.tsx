import Panel from "./components/Panel";
import Navbar from "./layout/Navbar";
import { Routes, Route } from "react-router-dom";
import PageHome from "./pages/PageHome";
import PageClientes from "./entities/clientes/Page";
import PageProductos from "./entities/productos/Page";
import PageMetodoPago from "./entities/metodo-pago/Page";
import PageItemVenta from "./entities/item-venta/Page";
import PageVentas from "./entities/ventas/Page";

export default function App() {
  
  return (
    <div className="flex h-screen">
      <Navbar />
      <Panel>
        <Routes>
          <Route path="/" element={<PageHome />} />
          <Route path="/clientes" element={<PageClientes />} />
          <Route path="/productos" element={<PageProductos />} />
          <Route path="/metodos-pago" element={<PageMetodoPago />} />
          <Route path="/items-venta" element={<PageItemVenta />} />
          <Route path="/ventas" element={<PageVentas />} />
        </Routes>
      </Panel>
    </div>
  )
}