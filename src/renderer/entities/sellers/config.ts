import type { CrudConfig } from '../CrudConfig'

export const vendedoresConfig: CrudConfig = {
  entity: 'vendedores',
  title: 'Vendedores',
  columns: ['id', 'nombre', 'dni'],
  searchFields: ['id', 'nombre', 'dni'],
  formInputs: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'dni', label: 'DNI', type: 'text' },
  ],
}

export default vendedoresConfig
