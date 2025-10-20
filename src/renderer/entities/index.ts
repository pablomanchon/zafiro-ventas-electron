import type { CrudConfig } from './CrudConfig'
import vendedoresConfig from './sellers/config' // 👈 import manual

const modules = import.meta.glob<{ default: CrudConfig }>('./*/config.ts', {
  eager: true,
})

export const crudConfigs: Record<string, CrudConfig> = Object.entries(modules)
  .reduce((acc, [path, mod]) => {
    const m = path.match(/\.\/([^\/]+)\/config\.ts$/)
    if (m) {
      const entityName = m[1]
      acc[entityName] = mod.default
    }
    return acc
  }, {} as Record<string, CrudConfig>)

// ✅ Agregar vendedores manualmente si por algún motivo el glob no lo incluyó
if (!crudConfigs['vendedores']) {
  crudConfigs['vendedores'] = vendedoresConfig
}
