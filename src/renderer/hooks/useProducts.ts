import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchProducts } from '../store/productsSlice'

export function useProducts() {
  const dispatch = useAppDispatch()
  const { items, loading, error } = useAppSelector(state => state.products)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  return { products: items, loading, error }
}
