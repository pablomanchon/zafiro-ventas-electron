import type { CrudConfig } from '../CrudConfig'

export const vendedoresConfig: CrudConfig = {
  entity: 'vendedores',
  title: 'Vendedores',
  columns: ['id', 'nombre'],
  searchFields: ['id', 'nombre'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  ],
}

export default vendedoresConfig
