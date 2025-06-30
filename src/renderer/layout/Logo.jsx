import React from 'react'
import logo from '../assets/logo.webp';

export default function Logo({ className }) {
    return (
        <div className='p-2'>
            <img src={logo} alt="Logo" className="m-auto animate-spin-slower p-2" />
        </div>
    )
}
