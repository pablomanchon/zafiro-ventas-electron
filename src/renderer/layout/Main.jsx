import React from 'react'

export default function Main({ className = '', children }) {
  return (
    <main
      className={`
        md:col-start-2
        h-screen w-full overflow-y-auto
        ${className}
      `}
    >
      <div className="w-full p-2 h-full rounded shadow-inner shadow-black border-black border-2 flex flex-col overflow-auto relative">
        {children}
      </div>
    </main>
  )
}
