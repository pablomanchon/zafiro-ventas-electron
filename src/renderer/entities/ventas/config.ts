import type { CrudConfig } from '../CrudConfig'

const ventasConfig: CrudConfig = {
  entity: 'ventas',
  title: 'Ventas',
  columns: [
    { titulo: 'ID Venta', clave: 'id' },
    { titulo: 'Cliente', clave: 'cliente.nombre' },
    { titulo: 'Vendedor', clave: 'vendedor.nombre' },
    { titulo: 'Total', clave: 'total', tipo: 'money' },
    { titulo: 'Fecha', clave: 'fecha' },
  ],
  searchFields: ['id', 'cliente.nombre', 'cliente.apellido', 'vendedor.nombre', 'total'],
  formInputs: [],
}

export default ventasConfig
