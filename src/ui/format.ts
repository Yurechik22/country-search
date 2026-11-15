const numberFormat = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatList(values: string[], fallback = '—'): string {
  return values.length > 0 ? values.join(', ') : fallback;
}
