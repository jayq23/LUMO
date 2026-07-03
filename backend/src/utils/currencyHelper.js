export const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
  MXN: '$',
  PHP: '₱'
};

export const getCurrencySymbol = (currency = 'PHP') => {
  return currencySymbols[currency] || '₱';
};