export const formatTokenAmount = (amount: number): string => {
  // First ensure 2 decimal places
  const fixed = amount.toFixed(2);

  // Then format with thousands separators
  return Number(fixed).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
