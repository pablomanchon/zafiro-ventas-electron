// src/layout/MainLayout.tsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Panel from '../components/Panel'

export default function MainLayout() {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden md:flex-row">
      <Navbar />
      <Panel>
        <Outlet />
      </Panel>
    </div>
  )
}
