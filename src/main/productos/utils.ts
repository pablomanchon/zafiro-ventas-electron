import * as XLSX from 'xlsx'
import * as fs from 'node:fs'
import * as path from 'node:path'

export type Producto = {
  id: string
  nombre: string
  precio: number
}

export type Column = { key: string; alias?: string; required?: boolean }

export class XlsxRequestDto {
  path!: string
  index?: number
  columns?: Column[]
}

// ───────────────────────────────────────────────────────────────────────────────
// Utilidades
// ───────────────────────────────────────────────────────────────────────────────
const normalize = (s: string) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // colapsa espacios
    .replace(/[|]/g, '|')           // por si vienen separadores raros
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin tildes

function parseNumber(n: any): number {
  if (typeof n === 'number') return n
  const s = String(n ?? '').trim()
  if (!s) return 0
  // Soporta "1.234,56" o "1,234.56" y simples
  const canon = s
    .replace(/\./g, '')   // saca miles con punto
    .replace(/,/g, '.')   // cambia coma por punto decimal
  const x = Number(canon)
  return Number.isFinite(x) ? x : 0
}

// ───────────────────────────────────────────────────────────────────────────────
// Lector principal
// ───────────────────────────────────────────────────────────────────────────────
export function getFromXlsx(
  url: string,
  hoja: number = 0,
  columnas: Column[] = []
): { productos: Producto[]; valorDolar: number } {
  // 1) Resolver y validar ruta
  const xlsxPath = path.isAbsolute(url) ? url : path.resolve(process.cwd(), url)
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`No encuentro el archivo Excel en: ${xlsxPath}`)
  }

  // 2) Leer workbook y hoja
  const workbook = XLSX.readFile(xlsxPath)
  const sheetName = workbook.SheetNames[hoja]
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`No se encontró la hoja ${hoja} en ${xlsxPath}`)

  // 3) JSON de filas (defval evita undefined)
  const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  // 4) Mapa de encabezados normalizados -> nombre real
  //    (toma la primera fila para detectar keys)
  const sample = raw[0] ?? {}
  const headerMap = new Map<string, string>()
  Object.keys(sample).forEach((k) => headerMap.set(normalize(k), k))

  // 5) Resolver nombres de columnas que esperamos (flexible)
  // nombres “típicos” de tu hoja
  const posiblesNombre = [
    'producto|servicio',
    'producto',
    'servicio',
    'descripcion',
    'nombre'
  ].map(normalize)
  const posiblesListaUsd = [
    'precio de lista',
    'lista usd',
    'precio lista usd'
  ].map(normalize)
  const posiblesPesos = [
    'precio en pesos',
    'precio pesos',
    'pesos'
  ].map(normalize)
  const posiblesDolar = [
    'valor dolar',
    'valor dólar',
    'dolar',
    'usd'
  ].map(normalize)

  const findHeader = (candidatos: string[]): string | undefined => {
    for (const c of candidatos) {
      const real = headerMap.get(c)
      if (real) return real
    }
    return undefined
  }

  const colNombre = findHeader(posiblesNombre)
  const colListaUsd = findHeader(posiblesListaUsd)
  const colPrecioPesos = findHeader(posiblesPesos)
  const colValorDolar = findHeader(posiblesDolar)

  if (!colNombre) {
    throw new Error(`No se encontró una columna de nombre de producto en los encabezados: ${[...headerMap.values()].join(', ')}`)
  }

  // 6) Buscar valor dólar (si existe en alguna fila)
  let valorDolar = 0
  if (colValorDolar) {
    const rowD = raw.find(r => parseNumber(r[colValorDolar]) > 0)
    if (rowD) valorDolar = parseNumber(rowD[colValorDolar])
  }

  // 7) Construir productos
  const productos: Producto[] = raw
    .map((r, i) => {
      const nombre = String(r[colNombre] ?? '').trim()
      const listaUsd = colListaUsd ? parseNumber(r[colListaUsd]) : 0
      const precioPesos = colPrecioPesos ? parseNumber(r[colPrecioPesos]) : 0

      const precio = (listaUsd > 0 && valorDolar > 0)
        ? listaUsd * valorDolar
        : precioPesos

      return {
        id: String(i + 1),
        nombre,
        precio: Number(precio.toFixed(2)),
      }
    })
    .filter(p => p.nombre.length > 0 && Number.isFinite(p.precio))

  // 8) (opcional) log
  // console.log('🧾 Lista de productos:')
  // productos.forEach(p => console.log(`• ${p.nombre} - $${p.precio.toLocaleString('es-AR')}`))
  // console.log(`💵 Valor dólar: ${valorDolar}`)

  return { productos, valorDolar }
}
