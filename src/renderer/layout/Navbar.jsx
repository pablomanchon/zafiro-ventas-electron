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
  ChevronDown,
  Settings,
  FileText,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import bgUrl from '/fondo-h.webp'
import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import logo from '/zafiro_rounded.ico'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Ventas', href: '/ventas', icon: <Receipt size={20} /> },
  { name: 'Caja', href: '/caja', icon: <Wallet size={20} /> },
  {
    name: 'Productos', href: '/productos', icon: <Package size={20} />,
    children: [
      { name: 'Stock', href: '/movimientos-stock', icon: <ArrowUpDown size={16} /> },
    ],
  },
  {
    name: 'Platos', href: '/platos', icon: <ChefHat size={20} />,
    children: [
      { name: 'Ingredientes', href: '/ingredientes', icon: <Salad size={16} /> },
    ],
  },
  { name: 'Clientes', href: '/clientes', icon: <Users size={20} /> },
  {
    name: 'Vendedores', href: '/vendedores', icon: <Users size={20} />,
    children: [
      { name: 'Horarios', href: '/horarios', icon: <Clock size={16} /> },
    ],
  },
  { name: 'Metodos de pago', href: '/metodos-pago', icon: <CreditCard size={20} /> },
  { name: 'Resumenes', href: '/resumenes', icon: <BarChart3 size={20} /> },
  {
    name: 'Configuracion', href: '/configuracion/negocio', icon: <Settings size={20} />,
    children: [
      { name: 'Negocio', href: '/configuracion/negocio', icon: <Building2 size={16} /> },
      { name: 'Facturacion', href: '/configuracion/facturacion', icon: <FileText size={16} /> },
      { name: 'Stock', href: '/configuracion/stock', icon: <AlertTriangle size={16} /> },
    ],
  },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({})
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const toggleGroup = (name) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const isGroupOpen = (item) => {
    if (openGroups[item.name] !== undefined) return openGroups[item.name]
    return item.children?.some(c => location.pathname === c.href) ?? false
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-3 left-3 z-40 rounded-xl bg-gray-800/90 p-2 shadow backdrop-blur md:hidden transition-all duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Menu size={28} className="text-white" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav
        style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        className={`fixed top-0 left-0 z-50 flex h-full w-[min(82vw,18rem)] flex-col overflow-y-auto border-r-2 border-cyan-700 text-white shadow shadow-black transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:animate-slide-in-left md:relative md:translate-x-0 md:h-screen md:w-60 md:min-w-52 md:flex-shrink-0 md:hover:border-r-cyan-600 md:hover:shadow-md md:hover:shadow-cyan-500 md:hover:transition-shadow`}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="text-white">
            <X size={28} />
          </button>
        </div>

        <div className="m-2 rounded-xl border border-black bg-black bg-opacity-50 p-2 shadow-inner shadow-black">
          <img src={logo} alt="Logo" className="m-auto max-w-16 animate-spin-slower p-1 md:max-w-20" />
        </div>

        <div className="px-2 pb-1">
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Kiosco</p>
            <p className="mt-0.5 break-words text-sm font-semibold">
              {profile?.kioscoNombre ?? 'Sin kiosco'}
            </p>
            <p className="break-all text-xs text-white/60">{profile?.email ?? ''}</p>
          </div>
        </div>

        <ul className="flex flex-col gap-1 p-2 pb-3">
          {navItems.map((item) => {
            if (!item.children) {
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-3 shadow-inner shadow-black transition-all hover:shadow-black hover:shadow-inner ${
                      isActive
                        ? 'bg-stone-900 bg-opacity-70 font-extrabold shadow-inner shadow-black'
                        : 'bg-black/30 hover:bg-sky-600/80'
                    }`
                  }
                >
                  {item.icon}
                  <span className="text-sm font-bold">{item.name}</span>
                </NavLink>
              )
            }

            const expanded = isGroupOpen(item)

            return (
              <li key={item.name} className="flex flex-col gap-1">
                <div className="flex items-stretch gap-0.5">
                  <NavLink
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex flex-1 items-center gap-2 rounded-l-lg px-3 py-3 shadow-inner shadow-black transition-all hover:shadow-black hover:shadow-inner ${
                        isActive
                          ? 'bg-stone-900 bg-opacity-70 font-extrabold'
                          : 'bg-black/30 hover:bg-sky-600/80'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="text-sm font-bold">{item.name}</span>
                  </NavLink>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className="rounded-r-lg bg-black/30 px-2 hover:bg-sky-600/80 transition-all shadow-inner shadow-black"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {expanded && (
                  <ul className="flex flex-col gap-1 pl-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href}
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 rounded-lg px-3 py-2 transition-all ${
                            isActive
                              ? 'bg-stone-900/70 font-extrabold shadow-inner shadow-black'
                              : 'bg-black/20 hover:bg-sky-600/70'
                          }`
                        }
                      >
                        {child.icon}
                        <span className="text-xs font-bold text-white/85">{child.name}</span>
                      </NavLink>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
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
