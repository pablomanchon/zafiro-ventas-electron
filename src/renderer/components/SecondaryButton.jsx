import React from 'react'

export default function SecondaryBtn({ functionClick, title, type = "", disabled = false, className = "" }) {
    return (
        <button disabled={disabled} type={type} className={`p-2 bg-green-800 border-black border-2 rounded shadow-black shadow-inner hover:bg-emerald-600 transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-800 ${className}`} onClick={functionClick}>{title}</button>
    )
}
