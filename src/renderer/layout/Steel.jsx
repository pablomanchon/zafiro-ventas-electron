import React from 'react'

export default function Steel({ children, className = '' }) {

    return (
        <div className={`from-zinc-800 to-cyan-900 p-2 justify-end bg-gradient-to-t rounded border-2 border-black shadow-black shadow ${className}`}>{children}</div>
    )
}
