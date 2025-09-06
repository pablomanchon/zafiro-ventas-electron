import React from 'react'

export default function Panel({ children }) {
    return (
        <div className='flex flex-col gap-2 text-white rounded shadow-inner shadow-black w-full'>
            {
                children
            }
        </div>
    )
}
//box-shadow: 0 0 15px inner