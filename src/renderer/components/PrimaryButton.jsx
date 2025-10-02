import React from 'react'

export default function PrimaryButton({ functionClick, title, type = "" }) {
  return (
    <button className='p-2 bg-cyan-800 border-black border-2 rounded shadow-black shadow-inner hover:bg-sky-600 transition-colors font-bold'
      type={type} onClick={functionClick}>{title}</button>
  )
}
