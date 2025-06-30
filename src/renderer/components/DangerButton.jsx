import React from 'react'

export default function DangerBtn({ functionClick, title, type = "" }) {
    return (
        <button type={type} className='p-2 bg-red-900 border-black border-2 rounded shadow-black shadow-inner hover:bg-orange-700 transition-colors' onClick={functionClick}>{title}</button>
    )
}
