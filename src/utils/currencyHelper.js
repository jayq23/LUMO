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


export const formatCurrency = (amount, currency = 'USD') => {
  const symbol = currencySymbols[currency] || '$';
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

export const getCurrencySymbol = (currency = 'USD') => {
  return currencySymbols[currency] || '$';
};
