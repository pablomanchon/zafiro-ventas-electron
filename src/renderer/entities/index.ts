import type { CrudConfig } from './CrudConfig'
/**
 * Carga en build-time todos los `config.ts` bajo cada carpeta de entidad:
 *   ./clientes/config.ts, ./productos/config.ts, …
 */
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
