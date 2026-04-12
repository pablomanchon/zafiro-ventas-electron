import React from 'react'

export default function Panel({ children }) {
    return (
        <div className='flex min-w-0 flex-1 flex-col gap-2 text-white rounded shadow-inner shadow-black w-full h-full min-h-0 overflow-hidden p-2 md:p-3'>
            {
                children
            }
        </div>
    )
}
//box-shadow: 0 0 15px inner
