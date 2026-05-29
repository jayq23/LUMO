/**
 * Currency formatting helper
 * Use with useAuth hook to get currency from preferences
 */
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


export const formatCurrency = (amount, currency = 'PHP') => {
  const symbol = currencySymbols[currency] || '₱';
  const number = parseFloat(amount);
  const formatted = number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
};

export const getCurrencySymbol = (currency = 'PHP') => {
  return currencySymbols[currency] || '₱';
};
