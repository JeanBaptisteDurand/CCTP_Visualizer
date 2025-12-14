/**
 * Format currency values with commas and 2 decimal places
 * Converts from micro-USDC (6 decimals) to dollars
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const dollars = numValue / 1e6; // Convert micro-USDC to dollars
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
