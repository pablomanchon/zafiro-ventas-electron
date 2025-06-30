// hooks/useProduct.ts
import { useEffect, useState } from 'react'
import { getAllProducts } from '../api/db'

export function useProduct() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getAllProducts()
        setProductos(res)
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { productos, loading, error }
}
