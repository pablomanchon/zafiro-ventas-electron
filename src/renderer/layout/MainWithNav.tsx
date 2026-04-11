// src/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Panel from '../components/Panel'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Navbar />
      <Panel>
        <Outlet />
      </Panel>
    </div>
  )
}
