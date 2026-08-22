export function canRestoreRefinanceMixes(hasCalculationContext, hasCachedMixes) {
  return Boolean(hasCalculationContext && hasCachedMixes);
}

export function getRefinanceMixPresentation(mixes, isPurchased) {
  const hasMixes = Array.isArray(mixes) && mixes.length > 0;
  return {
    hasMixes,
    showPayment: hasMixes && !isPurchased,
    isBlurred: hasMixes && !isPurchased,
    reportMixes: hasMixes && isPurchased ? mixes : [],
  };
}
