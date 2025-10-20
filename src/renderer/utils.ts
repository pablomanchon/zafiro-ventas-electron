export const formatCurrencyARS = (monto: number | string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(monto));
};

export const looksLikeMoneyKey = (key = "") =>
  /(total|precio|importe)/i.test(key);


// src/helpers/strings.ts
export function toSingular(title: string): string {
  if (!title) return ""

  // separar en palabras (para casos como "Métodos de pago")
  const parts = title.trim().split(/\s+/)
  const first = parts[0]

  const lower = first.toLowerCase()
  let singular = lower

  // Excepciones irregulares
  const exceptions: Record<string, string> = {
    'países': 'país',
    'lápices': 'lápiz',
    'métodos': 'método',
  }

  if (exceptions[lower]) {
    singular = exceptions[lower]
  } else if (lower.endsWith('ores')) {
    // vendedores → vendedor
    singular = lower.slice(0, -2)
  } else if (lower.endsWith('s')) {
    // productos → producto, cartas → carta
    singular = lower.slice(0, -1)
  }

  // Restaurar mayúscula inicial si el original la tenía
  const hadUpper = first[0] === first[0].toUpperCase()
  if (hadUpper) {
    singular = singular.charAt(0).toUpperCase() + singular.slice(1)
  }

  // Reemplazar la primera palabra singularizada
  parts[0] = singular
  return parts.join(' ')
}

