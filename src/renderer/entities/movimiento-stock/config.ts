// src/entities/movimiento-stock/config.ts
import type { CrudConfig } from '../CrudConfig'

const movimientoStockConfig: CrudConfig = {
  entity: 'movimiento-stock',
  title: 'Movimientos de Stock',

  columns: [
    { titulo: 'ID', clave: 'id' },
    { titulo: 'Tipo', clave: 'moveType' },
    { titulo: 'Productos', clave: 'productsMoveStock' },
    { titulo: 'Fecha', clave: 'fecha' },
  ],

  searchFields: [
    'id',
    'moveType',
  ],

  formInputs: [], // el form viene de la ventana hija, igual que Ventas
}

export default movimientoStockConfig
