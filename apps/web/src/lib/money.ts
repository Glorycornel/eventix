const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

export function currencyMultiplier(currency: string) {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
}

export function toMinorUnits(amount: string | number, currency: string) {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * currencyMultiplier(currency));
}

export function fromMinorUnits(amount: number, currency: string) {
  return amount / currencyMultiplier(currency);
}

export function formatMoney(amount: number, currency: string) {
  const upper = currency.toUpperCase();
  const value = fromMinorUnits(amount, upper);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: currencyMultiplier(upper) === 1 ? 0 : 2,
      maximumFractionDigits: currencyMultiplier(upper) === 1 ? 0 : 2,
    }).format(value);
  } catch {
    const decimals = currencyMultiplier(upper) === 1 ? 0 : 2;
    return `${upper} ${value.toFixed(decimals)}`;
  }
}
