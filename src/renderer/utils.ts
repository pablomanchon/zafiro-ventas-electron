// ==== Formato moneda para celdas NO input (usa Intl) ====
export const formatCurrencyARS = (monto: number | string) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(monto));
};

// ampliar claves detectadas como dinero
export const looksLikeMoneyKey = (key = "") =>
  /(total|precio|importe|monto|pago|cuota)/i.test(key);

// ==== Helpers de strings (tal cual pasaste) ====
export function toSingular(title: string): string {
  if (!title) return ""
  const parts = title.trim().split(/\s+/)
  const first = parts[0]
  const lower = first.toLowerCase()
  let singular = lower

  const exceptions: Record<string, string> = {
    'países': 'país',
    'lápices': 'lápiz',
    'métodos': 'método',
  }

  if (exceptions[lower]) {
    singular = exceptions[lower]
  } else if (lower.endsWith('ores')) {
    singular = lower.slice(0, -2) // vendedores → vendedor
  } else if (lower.endsWith('s')) {
    singular = lower.slice(0, -1) // productos → producto
  }

  const hadUpper = first[0] === first[0].toUpperCase()
  if (hadUpper) {
    singular = singular.charAt(0).toUpperCase() + singular.slice(1)
  }

  parts[0] = singular
  return parts.join(' ')
}

// ==== Formato ARS para INPUTS (muestra $ y miles, guarda limpio) ====
export const formatARS = (raw?: string | number) => {
  const v = typeof raw === 'number' ? String(raw) : (raw ?? '');
  const digits = digitsOnly(v);
  if (!digits) return '';
  return '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // $10.000.000
};

export const toNumber = (s?: string | number) => {
  if (typeof s === 'number') return s;
  return Number(digitsOnly(s ?? '')) || 0;
};

const digitsOnly = (s: string) => (s ?? '').replace(/\D/g, '');

// ======= Dinero con coma y centavos =======

// Limpia lo que escribe el usuario: deja dígitos y una sola coma
export const cleanMoneyInput = (s: string) =>
  (s ?? "")
    .replace(/[^\d,]/g, "")       // quita todo salvo dígitos y coma
    .replace(/,(?=.*,)/g, "");    // deja solo la primera coma

// "98.498,40" | "$98.498,4" | "98498,4" | "98498" -> centavos (integer)
export const toCents = (raw?: string | number): number => {
  if (raw == null) return 0;
  if (typeof raw === "number") return Math.trunc(raw * 100); // 98.5 -> 9850

  let s = String(raw).trim();
  s = s.replace(/\s|\$/g, "").replace(/\./g, ""); // saca $ y miles
  const [ent, dec = ""] = s.split(",");

  const cents = (dec + "00").slice(0, 2); // pad derecha a 2
  const entero = parseInt(ent || "0", 10);
  const cent = parseInt(cents || "0", 10);
  if (Number.isNaN(entero) || Number.isNaN(cent)) return 0;
  return entero * 100 + cent;
};

// centavos (int) -> "$ 98.498,40"
export const formatCentsARS = (cents: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

// centavos (int) -> string para el input ("98498,40" o "98498" si 00)
export const centsToInput = (cents: number) => {
  const abs = Math.trunc(Math.abs(cents));
  const ent = Math.trunc(abs / 100).toString();
  const dec = (abs % 100).toString().padStart(2, "0");
  return dec === "00" ? ent : `${ent},${dec}`;
};

export function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return String(d)
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}