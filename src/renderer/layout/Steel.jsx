import React from 'react'
import bgUrl from '../../../public/fondo-w.png'
export default function Wood({ children, className = '' }) {

    return (
        <div style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className={`from-zinc-800 to-cyan-900 p-2 justify-end bg-gradient-to-t rounded border-2 border-black shadow-black shadow ${className}`}>{children}</div>
    )
}
