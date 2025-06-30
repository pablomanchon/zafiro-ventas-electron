import React, { useEffect, useState } from 'react'
import { getAllProducts } from '../api/db'

export default function Carta({ producto }) {
  return (
    <>
      <div className='p-2 bg-violet-800 rounded shadow-black shadow-inner items-center flex flex-col'>
        <span>{producto.id}</span>
        <h3>{producto.nombre}</h3>
        <h4>{producto.precio}</h4>
      </div>
    </>
  )
}

/*  const [producto, setProducto] = useState({ id: 2, nombre: "Coca cola", precio: 2000 }) */