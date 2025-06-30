import React from 'react'

export default function Steel({ children, styles = '' }) {

    return (
        <div className={`from-zinc-800 to-cyan-500  p-2 justify-end bg-zinc-800 ${styles}`}>{children}</div>
    )
}
