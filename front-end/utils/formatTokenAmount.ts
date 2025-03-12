export const formatTokenAmount = (amount: number | undefined | null): string => {
  // Handle undefined or null values
  if (amount === undefined || amount === null) {
    return "0.00";
  }
  
  // First ensure 2 decimal places
  const fixed = amount.toFixed(2);
  
  // Then format with thousands separators
  return Number(fixed).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};