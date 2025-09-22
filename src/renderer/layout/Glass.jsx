import React from 'react'

export default function Glass({ children, className = '' }) {

    return (
        <div style={{backdropFilter:'blur(1px)'}} className={`bg-black bg-opacity-55 rounded p-2 ${className}`}>{children}</div>
    )
}
