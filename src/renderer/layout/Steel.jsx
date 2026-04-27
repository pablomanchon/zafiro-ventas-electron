import React from 'react'
import bgUrl from '../../../public/fondo-w.webp'
import bgUrl2 from '../../../public/fondo-h.webp'
import bgUrl3 from '../../../public/fondo-sq.webp'
export default function Wood({ children, typeWood = 1, ...props }) {
    const getBg = () =>{
        switch (typeWood) {
            case 1:
                return `${bgUrl}`
            case 2:
                return `${bgUrl2}`
            case 3:
                return `${bgUrl3}`
        }
    }

    return (
        <div style={{ backgroundImage: `url(${getBg()})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className={`from-zinc-800 to-cyan-900 p-2 justify-end bg-gradient-to-t rounded border-2 border-black shadow-black shadow ${props.className}`}>{children}</div>
    )
}
