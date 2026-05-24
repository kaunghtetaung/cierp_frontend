// Spreadsheet import helper for the DataTable section editor.
//
// Reads a CSV/XLSX file via SheetJS and returns a normalised
// `{ headers, rows }` shape. Also offers a column-type inference
// helper so authors don't have to set the `type` enum by hand on every
// imported column. They can still override afterwards in the form.
//
// `xlsx` is dynamically imported so the section editor bundle stays
// lean for users who never use this feature.

export interface ParsedSpreadsheet {
  /** Header row, normalised — trimmed strings. */
  headers: string[];
  /** Data rows, each as a string[] aligned positionally to `headers`. */
  rows: string[][];
}

export type InferredColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'currency'
  | 'percentage';

/**
 * Parse a user-uploaded CSV/XLSX/XLS file. SheetJS handles all three
 * via the same code path. Returns headers + rows; throws if the sheet
 * is empty or unreadable.
 */
export async function parseSpreadsheetFile(
  file: File,
): Promise<ParsedSpreadsheet> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet has no sheets');
  }
  const sheet = workbook.Sheets[firstSheetName];

  // `header: 1` returns plain rows (string[][]) instead of objects keyed
  // by header name — we want the raw layout so we can pick the header
  // row ourselves and keep cell ordering.
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false, // coerce values to strings; numeric formatting preserved
  });

  if (!aoa || aoa.length === 0) {
    throw new Error('Spreadsheet is empty');
  }

  const [headerRow, ...dataRows] = aoa;
  const headers = (headerRow || []).map((h) => String(h ?? '').trim());

  // Drop trailing all-blank columns the spreadsheet engine may emit.
  while (headers.length > 0 && headers[headers.length - 1] === '') {
    headers.pop();
  }

  const rows = dataRows
    .map((row) =>
      headers.map((_, idx) => String((row && row[idx]) ?? '').trim()),
    )
    // Drop fully-blank rows (Excel often pads tail with empties).
    .filter((row) => row.some((cell) => cell !== ''));

  if (headers.length === 0) {
    throw new Error('No header row detected');
  }

  return { headers, rows };
}

const NUMBER_RE = /^-?\d+(?:[,.]\d+)?$/;
const PERCENT_RE = /^-?\d+(?:\.\d+)?\s*%$/;
const CURRENCY_RE = /^[A-Z]{0,3}\s*[$€£¥₹₩₫฿₱]?\s*-?\d{1,3}(?:[,]\d{3})*(?:\.\d+)?$|^-?\d+(?:[,.]\d+)?\s*(USD|EUR|GBP|JPY|MMK|THB|SGD)$/;
const BOOL_VALUES = new Set([
  'true',
  'false',
  'yes',
  'no',
  'y',
  'n',
  '1',
  '0',
]);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/;

/**
 * Infer a column's `type` enum value from its sampled values. Returns
 * `'text'` whenever the samples are mixed or empty — authors can
 * override after the import lands.
 *
 * Heuristic: a type is chosen only if ≥ 80% of non-empty samples
 * match. Avoids mis-flagging a "Status" column with one stray "12"
 * row as `'number'`.
 */
export function inferColumnType(values: string[]): InferredColumnType {
  const nonEmpty = values
    .map((v) => (v ?? '').trim())
    .filter((v) => v !== '');
  if (nonEmpty.length === 0) return 'text';

  const total = nonEmpty.length;
  let nNum = 0;
  let nBool = 0;
  let nDate = 0;
  let nPercent = 0;
  let nCurrency = 0;

  for (const v of nonEmpty) {
    const lower = v.toLowerCase();
    if (BOOL_VALUES.has(lower)) nBool++;
    if (PERCENT_RE.test(v)) nPercent++;
    else if (CURRENCY_RE.test(v.toUpperCase())) nCurrency++;
    else if (NUMBER_RE.test(v)) nNum++;
    if (ISO_DATE_RE.test(v) || !Number.isNaN(Date.parse(v))) nDate++;
  }

  const threshold = Math.ceil(total * 0.8);
  if (nPercent >= threshold) return 'percentage';
  if (nCurrency >= threshold) return 'currency';
  if (nNum >= threshold) return 'number';
  if (nBool >= threshold) return 'boolean';
  // Date check is the loosest — only commit if the ISO-style hits a
  // strong majority. Date.parse() accepts way too many strings.
  const nIsoStrict = nonEmpty.filter((v) => ISO_DATE_RE.test(v)).length;
  if (nIsoStrict >= threshold) return 'date';

  return 'text';
}

/**
 * Slug a header string into a stable column key. Mirrors the helper
 * already used inside `DataTableSectionForm` for ad-hoc column adds.
 */
export function slugifyHeader(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32);
}

/**
 * De-duplicate a list of column keys by appending `_2`, `_3`, … to
 * collisions. Pure helper — keeps the imported column list valid even
 * when two source headers slug to the same string ("Total" vs "Total
 * (USD)" → both `total`).
 */
export function uniquifyKeys(keys: string[]): string[] {
  const seen = new Map<string, number>();
  return keys.map((raw) => {
    const base = raw || 'col';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}
