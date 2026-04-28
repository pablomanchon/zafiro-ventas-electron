import React from 'react'

export default function Panel({ children }) {
    return (
        <div className='flex min-w-0 flex-1 flex-col gap-2 text-white rounded shadow-inner shadow-cyan-950 w-full h-full min-h-0 overflow-hidden p-2 md:p-3 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-950'>
            {
                children
            }
        </div>
    )
}
//box-shadow: 0 0 15px inner
