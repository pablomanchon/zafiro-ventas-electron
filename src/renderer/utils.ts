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
