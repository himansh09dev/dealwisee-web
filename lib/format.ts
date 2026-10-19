const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Prices are stored as integer cents to avoid floating-point drift. */
export function formatPrice(cents: number, { precise = false } = {}) {
  const value = cents / 100;
  return (precise || !Number.isInteger(value) ? currencyPrecise : currency).format(value);
}

/** Signed percentage, e.g. -14% or +3%. Uses a real minus sign for typography. */
export function formatDelta(ratio: number) {
  const pct = Math.round(ratio * 100);
  if (pct === 0) return "0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

export function formatShortDate(iso: string) {
  return shortDate.format(new Date(iso));
}
