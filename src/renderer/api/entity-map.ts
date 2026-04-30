export type EntityName =
  | 'productos'
  | 'clientes'
  | 'vendedores'
  | 'metodo-pago'
  | 'item-venta'
  | 'ingredientes'
  | 'movimiento-stock'
  | 'ventas'
  | 'platos'

type TableEntityConfig = {
  kind: 'table'
  table: string
  primaryKey?: string
  softDelete?: boolean
  orderBy?: { column: string; ascending: boolean }
  extraFilters?: Record<string, unknown>
  select?: string
  serialize?: (payload: any) => any
}

type RpcEntityConfig = {
  kind: 'rpc'
  listRpc: string
  listArgs?: (params?: Record<string, any>) => Record<string, unknown> | undefined
  createRpc: string
  getRpc?: string
  updateRpc?: string
  removeRpc?: string
}

export type EntityConfig = TableEntityConfig | RpcEntityConfig

const entityMap: Record<EntityName, EntityConfig> = {
  productos: {
    kind: 'table',
    table: 'producto',
    softDelete: true,
    orderBy: { column: 'id', ascending: true },
    serialize: (payload: any) => {
      const { stock, stockMinimo, ...rest } = payload ?? {}
      if (stockMinimo !== undefined) rest.stock_minimo = stockMinimo
      return rest
    },
  },
  clientes: {
    kind: 'table',
    table: 'cliente',
    softDelete: true,
    orderBy: { column: 'id', ascending: true },
  },
  vendedores: {
    kind: 'table',
    table: 'vendedor',
    softDelete: true,
    orderBy: { column: 'id', ascending: true },
  },
  'metodo-pago': {
    kind: 'table',
    table: 'metodo_pago',
    primaryKey: 'id',
    softDelete: true,
    orderBy: { column: 'nombre', ascending: true },
  },
  'item-venta': {
    kind: 'table',
    table: 'item_venta',
    softDelete: false,
    orderBy: { column: 'id', ascending: false },
  },
  ingredientes: {
    kind: 'table',
    table: 'ingredientes',
    softDelete: true,
    orderBy: { column: 'nombre', ascending: true },
    select:
      'id,nombre,unidadBase:unidad_base,cantidadBase:cantidad_base,codigo,precioCostoBase:precio_costo_base,deleted',
    serialize: (payload: any) => ({
      ...payload,
      unidad_base: payload?.unidadBase,
      cantidad_base: payload?.cantidadBase,
      precio_costo_base: payload?.precioCostoBase,
      unidadBase: undefined,
      cantidadBase: undefined,
      precioCostoBase: undefined,
    }),
  },
  'movimiento-stock': {
    kind: 'rpc',
    listRpc: 'movimiento_stock_listar',
    listArgs: () => undefined,
    createRpc: 'movimiento_stock_crear',
    getRpc: 'movimiento_stock_detalle',
  },
  ventas: {
    kind: 'rpc',
    listRpc: 'ventas_listar',
    listArgs: (params) => ({
      p_from: params?.from ?? null,
      p_to: params?.to ?? null,
    }),
    createRpc: 'ventas_crear',
    getRpc: 'ventas_detalle',
    updateRpc: 'ventas_actualizar',
    removeRpc: 'ventas_borrar',
  },
  platos: {
    kind: 'rpc',
    listRpc: 'platos_listar',
    listArgs: () => undefined,
    createRpc: 'platos_crear',
    getRpc: 'platos_detalle',
    updateRpc: 'platos_actualizar',
    removeRpc: 'platos_borrar',
  },
}

export function getEntityConfig(entity: EntityName): EntityConfig {
  const config = entityMap[entity]
  if (!config) throw new Error(`Entidad no soportada en modo web: ${entity}`)
  return config
}

export function isRpcEntity(config: EntityConfig): config is RpcEntityConfig {
  return config.kind === 'rpc'
}
