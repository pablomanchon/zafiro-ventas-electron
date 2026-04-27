import {
  Users,
  Package,
  CreditCard,
  Receipt,
  Menu,
  X,
  BarChart3,
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  ChefHat,
  Salad,
  Clock,
} from 'lucide-react'
import bgUrl from '/fondo-h.webp'
import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '/zafiro_rounded.ico'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Ventas', href: '/ventas', icon: <Receipt size={20} /> },
  { name: 'Productos', href: '/productos', icon: <Package size={20} /> },
  { name: 'Caja', href: '/caja', icon: <Wallet size={20} /> },
  { name: 'Resumenes', href: '/resumenes', icon: <BarChart3 size={20} /> },
  { name: 'Clientes', href: '/clientes', icon: <Users size={20} /> },
  { name: 'Vendedores', href: '/vendedores', icon: <Users size={20} /> },
  { name: 'Metodos de pago', href: '/metodos-pago', icon: <CreditCard size={20} /> },
  { name: 'Stock', href: '/movimientos-stock', icon: <ArrowUpDown size={20} /> },
  { name: 'Ingredientes', href: '/ingredientes', icon: <Salad size={20} /> },
  { name: 'Platos', href: '/platos', icon: <ChefHat size={20} /> },
  { name: 'Horarios', href: '/horarios', icon: <Clock size={20} /> },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useAuth()

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-40 rounded-xl bg-gray-800/90 p-2 shadow backdrop-blur md:hidden"
        >
          <Menu size={28} className="text-white" />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        className={`fixed top-0 left-0 z-50 flex h-full w-[min(82vw,18rem)] flex-col overflow-y-auto border-r-2 border-cyan-700 text-white shadow shadow-black ${
          isOpen ? '' : 'hidden'
        } md:relative md:block md:h-screen md:w-60 md:min-w-52 md:flex-shrink-0 md:hover:border-r-cyan-600 md:hover:shadow-md md:hover:shadow-cyan-500 md:hover:transition-shadow transition-shadow`}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="text-white">
            <X size={28} />
          </button>
        </div>

        <div className="m-3 rounded-xl border border-black bg-black bg-opacity-50 p-4 shadow-inner shadow-black md:m-5 md:p-5">
          <img src={logo} alt="Logo" className="m-auto max-w-24 animate-spin-slower p-2 md:max-w-full" />
        </div>

        <div className="px-3 pb-2 md:px-4">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Kiosco</p>
            <p className="mt-1 break-words text-sm font-semibold md:text-base">
              {profile?.kioscoNombre ?? 'Sin kiosco'}
            </p>
            <p className="mt-1 break-all text-xs text-white/60">{profile?.email ?? ''}</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2 p-2 pb-4 text-center md:p-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `z-10 flex items-center gap-2 rounded-lg p-2.5 shadow-inner shadow-black transition-all hover:shadow-black hover:shadow-inner ${
                  isActive
                    ? 'bg-stone-900 bg-opacity-70 font-extrabold shadow-inner shadow-black'
                    : 'bg-black/30 hover:bg-sky-600 hover:bg-opacity-80'
                }`
              }
            >
              {item.icon}
              <span className="text-sm font-bold md:text-base">{item.name}</span>
            </NavLink>
          ))}
        </ul>

        <div className="mt-auto p-2 md:p-3">
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Cerrar sesion
          </button>
        </div>
      </nav>
    </>
  )
}
