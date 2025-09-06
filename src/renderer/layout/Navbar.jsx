import {
  Home,
  Users,
  Package,
  CreditCard,
  ShoppingCart,
  Receipt,
  Menu,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.webp';


const navItems = [
  { name: "Inicio", href: "/", icon: <Home size={20} /> },
  { name: "Clientes", href: "/clientes", icon: <Users size={20} /> },
  { name: "Productos", href: "/productos", icon: <Package size={20} /> },
  { name: "Métodos de pago", href: "/metodos-pago", icon: <CreditCard size={20} /> },
  { name: "Ventas", href: "/ventas", icon: <Receipt size={20} /> },
  { name: "Resumenes", href: "/resumenes", icon: <Receipt size={20} /> },
]

export default function Navbar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón externo solo visible en mobile y cuando navbar está cerrado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 bg-gray-700 p-2 rounded shadow md:hidden"
        >
          <Menu size={28} className="text-white" />
        </button>
      )}

      {/* Overlay para cerrar tocando fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navbar */}
      <nav
        className={`bg-gradient-to-t from-gray-900 to-cyan-800 text-white shadow-black shadow border-r-2 z-50
          border-cyan-700
          fixed top-0 left-0 h-full w-60 flex flex-col 
          ${isOpen ? '' : 'hidden'}
          md:block md:relative md:min-w-52 md:hover:border-r-cyan-600 md:hover:shadow-cyan-500 md:hover:shadow-md md:hover:transition-shadow transition-shadow`}
      >
        {/* Encabezado móvil con logo y botón de cerrar */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="text-white">
            <X size={28} />
          </button>
        </div>

        <div className='p-2'>
          <img src={logo} alt="Logo" className="m-auto animate-spin-slower p-2" />
        </div>

        {/* Navegación */}
        <ul className='flex flex-col gap-2 text-center p-1'>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={`rounded p-2 transition-all flex items-center gap-2 z-10 hover:shadow-black shadow-inner shadow-black hover:shadow-inner
                ${location.pathname === item.href
                  ? ' shadow-black bg-sky-600 font-extrabold shadow-inner'
                  : 'bg-gay-900 hover:bg-sky-600'}`}
            >
              {item.icon}
              <span className='w-full font-bold'>{item.name}</span>
            </Link>
          ))}
        </ul>
      </nav>
    </>
  )
}
