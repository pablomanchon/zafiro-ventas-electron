import CrudPage from './CrudPage';

export default function PageProductos() {
  const config = {
    entity: 'productos',
    title: 'Productos',
    columns: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'sku'],
    searchFields: ['nombre', 'descripcion', 'sku'],
    formInputs: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'text' },
      { name: 'precio', label: 'Precio', type: 'number', required: true },
      { name: 'stock', label: 'Stock', type: 'number', required: true },
      { name: 'sku', label: 'SKU', type: 'text' },
    ],
  };

  return <CrudPage config={config} />;
}
