// src/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Panel from '../components/Panel'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      <Navbar />
      <Panel>
        <Outlet />
      </Panel>
    </div>
  )
}
