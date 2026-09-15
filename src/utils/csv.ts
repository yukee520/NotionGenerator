export type CsvValue = string | number | boolean | null | undefined;

export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'string' ? value : String(value);
  const needsQuoting =
    raw.includes(',') ||
    raw.includes('"') ||
    raw.includes('\n') ||
    raw.includes('\r') ||
    raw.startsWith(' ') ||
    raw.endsWith(' ');
  if (!needsQuoting) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

export function toCsvRow(values: CsvValue[]): string {
  return values.map(escapeCsvCell).join(',');
}

export function toCsv(rows: CsvValue[][], includeHeader = true): string {
  if (rows.length === 0) return '';
  const [first, ...rest] = rows;
  const body = includeHeader
    ? [first, ...rest].map(toCsvRow)
    : rest.map(toCsvRow);
  return body.join('\n');
}

export function kvToRow(
  keys: string[],
  record: Record<string, CsvValue>,
): string {
  return toCsvRow(keys.map((k) => record[k]));
}