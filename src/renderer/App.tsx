import Panel from "./components/Panel";
import Navbar from "./layout/Navbar";
import { Routes, Route } from "react-router-dom";
import PageHome from "./pages/PageHome";

export default function App() {
  
  return (
    <div className="flex h-screen">
      <Navbar />
      <Panel>
        <Routes>
          <Route path="/" element={
            <PageHome />} />
        </Routes>
      </Panel>
    </div>
  )
}