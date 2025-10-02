import { useProducts } from '../hooks/useProducts'

export default function PageHome() {
  const { products, loading, error } = useProducts()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error loading products</div>

  return (
    <div className="w-full grid grid-cols-3 gap-2 p-2">
      {products.map(p => (
        <div key={p.id} className="p-2 bg-gray-800 rounded text-white">
          {p.nombre}
        </div>
      ))}
    </div>
  )
}
