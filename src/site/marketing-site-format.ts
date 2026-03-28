const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("en-GB");

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrency(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return currencyFormatter.format(value);
}

export function formatArea(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${numberFormatter.format(value)} sqm`;
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatBedrooms(value: number | null): string {
  if (value === null) {
    return "Beds n/a";
  }

  return `${numberFormatter.format(value)} bed`;
}

export function formatPercent(value: number | null): string {
  if (value === null) {
    return "n/a";
  }

  return `${numberFormatter.format(value)}%`;
}

export function humanizePropertyType(value: string): string {
  return value
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
