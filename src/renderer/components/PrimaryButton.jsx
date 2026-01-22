import React from 'react'

export default function PrimaryButton({ functionClick, title, type = "", ...props }) {
  return (
    <button disabled={props.disabled} className={`p-2 bg-cyan-800 border-black border-2 rounded shadow-black shadow-inner hover:bg-sky-600 transition-colors font-bold ${props.className}`}
      type={type} onClick={functionClick}>{title}</button>
  )
}
