import {
  Home,
  Users,
  Package,
  CreditCard,
  ShoppingCart,
  Receipt,
  Menu,
  X,
  BarChart3,
  Wallet,
  Boxes,
  Warehouse,
  ArrowUpDown,
  ChefHat,
  Salad,
  Clock
} from 'lucide-react'
import bgUrl from '/fondo-h.png'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '/zafiro_rounded.ico';
import { useAuth } from '../hooks/useAuth';


const navItems = [
  { name: "Inicio", href: "/", icon: <Home size={20} /> },
  { name: "Ventas", href: "/ventas", icon: <Receipt size={20} /> },
  { name: "Productos", href: "/productos", icon: <Package size={20} /> },
  { name: "Caja", href: "/caja", icon: <Wallet size={20} /> },
  { name: "Resumenes", href: "/resumenes", icon: <BarChart3 size={20} /> },
  { name: "Clientes", href: "/clientes", icon: <Users size={20} /> },
  { name: "Vendedores", href: "/vendedores", icon: <Users size={20} /> },
  { name: "Métodos de pago", href: "/metodos-pago", icon: <CreditCard size={20} /> },
  { name: "Stock", href: "/movimientos-stock", icon: <ArrowUpDown size={20} /> },
  { name: "Ingredientes", href: "/ingredientes", icon: <Salad size={20} /> },
  { name: "Platos", href: "/platos", icon: <ChefHat size={20} /> },
  { name: "Horarios", href: "/horarios", icon: <Clock size={20} /> },
]

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { profile, signOut } = useAuth()

  return (
    <>
      {/* Botón externo solo visible en mobile y cuando navbar está cerrado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-40 bg-gray-800/90 backdrop-blur p-2 rounded-xl shadow md:hidden"
        >
          <Menu size={28} className="text-white" />
        </button>
      )}

      {/* Overlay para cerrar tocando fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navbar */}
      <nav
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        className={`text-white shadow-black shadow border-r-2 z-50
    border-cyan-700
    fixed top-0 left-0 h-full w-[min(82vw,18rem)] flex flex-col 
    ${isOpen ? '' : 'hidden'}
    md:block md:relative md:w-60 md:min-w-52 md:hover:border-r-cyan-600 md:hover:shadow-cyan-500 md:hover:shadow-md md:hover:transition-shadow transition-shadow overflow-y-auto`}
      >
        {/* Encabezado móvil con logo y botón de cerrar */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="text-white">
            <X size={28} />
          </button>
        </div>

        <div className='rounded-xl border-black border shadow-inner shadow-blac m-3 md:m-5 p-4 md:p-5 shadow-black bg-black bg-opacity-50'>
          <img src={logo} alt="Logo" className="m-auto animate-spin-slower p-2 max-w-24 md:max-w-full" />
        </div>

        <div className="px-3 md:px-4 pb-2">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-left">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Kiosco</p>
            <p className="mt-1 font-semibold text-sm md:text-base break-words">
              {profile?.kioscoNombre ?? 'Sin kiosco'}
            </p>
            <p className="mt-1 text-xs text-white/60 break-all">{profile?.email ?? ''}</p>
          </div>
        </div>

        {/* Navegación */}
        <ul className='flex flex-col gap-2 text-center p-2 md:p-1 pb-4'>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`rounded-lg p-2.5 transition-all flex items-center backgrou gap-2 z-10 hover:shadow-black shadow-inner shadow-black hover:shadow-inner
                ${location.pathname === item.href
                  ? ' shadow-black bg-stone-900 bg-opacity-70 font-extrabold shadow-inner'
                  : 'bg-gay-900 hover:bg-sky-600 hover:bg-opacity-80 bg-opacity-70'}`}
            >
              {item.icon}
              <span className='font-bold text-sm md:text-base'>{item.name}</span>
            </Link>
          ))}
        </ul>

        <div className="mt-auto p-2 md:p-3">
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  )
}
