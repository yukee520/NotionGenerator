export function formatCurrency(amount: number, currency = 'USD'): string {
  const rounded = Math.round(amount * 100) / 100;
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    MYR: 'RM',
    SGD: 'S$',
    CNY: '¥',
    JPY: '¥',
    INR: '₹',
    AUD: 'A$',
  };
  const symbol = symbols[currency.toUpperCase()] ?? '';
  if (symbol) return `${symbol}${rounded.toFixed(2)}`;
  return `${rounded.toFixed(2)} ${currency.toUpperCase()}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function truncate(input: string, max: number): string {
  if (!input) return '';
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function titleCase(input: string): string {
  if (!input) return '';
  return input
    .split(/\s+/)
    .map((word) =>
      word.length === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ');
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count} ${word}`;
}

export function compactWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function initialsFromTitle(input: string): string {
  const words = compactWhitespace(input).split(' ').filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}