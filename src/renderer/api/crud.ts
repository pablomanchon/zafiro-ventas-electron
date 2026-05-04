import { supabase } from './supabase'
import { getEntityConfig, isRpcEntity, type EntityName } from './entity-map'

type QueryParams = Record<string, any>

function normalizeError(error: unknown): never {
  if (error instanceof Error) throw error.message
  if (typeof error === 'string') throw error
  if (error && typeof error === 'object') {
    const maybe = error as Record<string, unknown>
    const message = typeof maybe.message === 'string' ? maybe.message : null
    const details = typeof maybe.details === 'string' ? maybe.details : null
    const code = typeof maybe.code === 'string' ? maybe.code : null
    const parts = [message, details, code ? `(${code})` : null].filter(Boolean)
    if (parts.length > 0) throw parts.join(' ')
  }
  throw 'Ocurrio un error inesperado'
}

function withRangeParams(params?: QueryParams) {
  return {
    p_from: params?.from ?? null,
    p_to: params?.to ?? null,
  }
}

async function runRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return normalizeError(error)
  return data as T
}

export async function getAll<T = any>(
  entity: string,
  params?: QueryParams,
): Promise<T[]> {
  try {
    if (entity === 'ventas/totales/tipos') {
      return await runRpc<T[]>('ventas_totales_por_tipo_pago', withRangeParams(params))
    }

    const config = getEntityConfig(entity as EntityName)

    if (isRpcEntity(config)) {
      const data = await runRpc<T[]>(
        config.listRpc,
        config.listArgs ? config.listArgs(params) : undefined
      )

      if (entity === 'ventas' && params?.clienteId != null) {
        const clienteId = String(params.clienteId)
        return (data ?? []).filter((venta: any) =>
          String(venta?.clienteId ?? venta?.cliente?.id ?? '') === clienteId
        )
      }

      return data
    }

    let query = supabase.from(config.table).select(config.select ?? '*')

    if (config.softDelete) query = query.eq('deleted', false)
    if (config.extraFilters) {
      for (const [column, value] of Object.entries(config.extraFilters)) {
        query = query.eq(column, value)
      }
    }
    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending })
    }

    const { data, error } = await query
    if (error) return normalizeError(error)
    return (data ?? []) as T[]
  } catch (error) {
    return normalizeError(error)
  }
}

export async function create<T = any>(entity: string, payload: any): Promise<T> {
  try {
    const config = getEntityConfig(entity as EntityName)

    if (isRpcEntity(config)) {
      return await runRpc<T>(config.createRpc, { payload })
    }

    const serializedPayload = config.serialize ? config.serialize(payload) : payload

    const { data, error } = await supabase
      .from(config.table)
      .insert(serializedPayload)
      .select(config.select ?? '*')
      .single()

    if (error) return normalizeError(error)
    return data as T
  } catch (error) {
    return normalizeError(error)
  }
}

export async function update<T = any>(entity: string, id: number | string, payload: any): Promise<T> {
  try {
    const config = getEntityConfig(entity as EntityName)

    if (isRpcEntity(config)) {
      if (!config.updateRpc) throw new Error(`La entidad ${entity} aun no soporta update web`)
      return await runRpc<T>(config.updateRpc, { p_id: id, payload })
    }

    const serializedPayload = config.serialize ? config.serialize(payload) : payload

    const { data, error } = await supabase
      .from(config.table)
      .update(serializedPayload)
      .eq(config.primaryKey ?? 'id', id)
      .select(config.select ?? '*')
      .single()

    if (error) return normalizeError(error)
    return data as T
  } catch (error) {
    return normalizeError(error)
  }
}

export async function getById<T = any>(entity: string, id: number | string): Promise<T> {
  try {
    const config = getEntityConfig(entity as EntityName)

    if (isRpcEntity(config)) {
      if (!config.getRpc) throw new Error(`La entidad ${entity} aun no soporta detalle web`)
      return await runRpc<T>(config.getRpc, { p_id: id })
    }

    let query = supabase
      .from(config.table)
      .select(config.select ?? '*')
      .eq(config.primaryKey ?? 'id', id)

    if (config.softDelete) query = query.eq('deleted', false)

    const { data, error } = await query.single()
    if (error) return normalizeError(error)
    return data as T
  } catch (error) {
    return normalizeError(error)
  }
}

export async function remove<T = any>(entity: string, id: number | string): Promise<T> {
  try {
    const config = getEntityConfig(entity as EntityName)

    if (isRpcEntity(config)) {
      if (!config.removeRpc) throw new Error(`La entidad ${entity} aun no soporta delete web`)
      return await runRpc<T>(config.removeRpc, { p_id: id })
    }

    if (config.softDelete) {
      const { data, error } = await supabase
        .from(config.table)
        .update({ deleted: true })
        .eq(config.primaryKey ?? 'id', id)
        .select(config.select ?? '*')
        .single()

      if (error) return normalizeError(error)
      return data as T
    }

    const { data, error } = await supabase
      .from(config.table)
      .delete()
      .eq(config.primaryKey ?? 'id', id)
      .select(config.select ?? '*')
      .single()

    if (error) return normalizeError(error)
    return data as T
  } catch (error) {
    return normalizeError(error)
  }
}
