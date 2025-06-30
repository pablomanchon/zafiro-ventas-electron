import React from 'react'

export default function Main({ children }) {
  return (
    <main className='md:col-start-2 h-screen w-full overflow-y-auto '>
      <div className='w-full h-full rounded shadow-inner shadow-black border-black border-2 flex flex-col overflow-auto relative'>
        {children}
      </div>
    </main>
  )
}
