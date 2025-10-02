// src/entities/ventas/config.ts
import type { CrudConfig } from '../CrudConfig'

const ventasConfig: CrudConfig = {
  entity: 'ventas',
  title: 'Ventas',
    columns: [
    { titulo: 'ID Venta',    clave: 'id' },
    { titulo: 'Cliente ID',  clave: 'cliente.id' },
    { titulo: 'Total',       clave: 'total' },
    { titulo: 'Fecha',       clave: 'fecha' },
  ],
  searchFields: ['id', 'clienteNombre', 'total'],
  formInputs: [],   // ← aunque SalesPage no lo use, lo dejas para que CrudConfig no marque error
}

export default ventasConfig
