import React from 'react'

export default function SecondaryBtn({ functionClick, title, type = "" }) {
    return (
        <button type={type} className='p-2 bg-green-800 border-black border-2 rounded shadow-black shadow-inner hover:bg-emerald-600 transition-colors' onClick={functionClick}>{title}</button>
    )
}
