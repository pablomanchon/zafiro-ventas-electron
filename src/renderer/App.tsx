import Panel from "./components/Panel";
import Navbar from "./layout/Navbar";
import { Routes, Route } from "react-router-dom";
import PageHome from "./pages/PageHome";
import PageClientes from "./pages/PageClientes";
import PageProductos from "./pages/PageProductos";
import PageMetodoPago from "./pages/PageMetodoPago";
import PageItemVenta from "./pages/PageItemVenta";

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
        </Routes>
      </Panel>
    </div>
  )
}