import React from 'react'

export default function Title({ children, className = '' }) {
    return (
        <h2 className={`text-xl font-bold border-b-2 w-full text-center ${className}`}>{children}</h2>
    )
}
