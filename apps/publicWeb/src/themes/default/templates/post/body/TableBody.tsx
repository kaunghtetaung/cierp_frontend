import React from "react";
import Link from "next/link";

interface TableColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "link";
}

interface TableBlockData {
  columns: TableColumn[];
  rows: Array<Record<string, unknown>>;
  settings?: {
    pageSize?: number;
    searchable?: boolean;
    sortable?: boolean;
  };
}

interface TableBodyProps {
  block?: TableBlockData | null;
}

/**
 * Table body — renders the post's `tableBlock` as a static HTML
 * table with type-aware cell formatting:
 *   - `date`   → ISO string → locale-formatted date
 *   - `link`   → URL → clickable Next Link (external opens new tab)
 *   - `number` → numeric formatting
 *   - default  → string
 *
 * Server component. The `searchable` / `sortable` / `pageSize`
 * settings are author-facing — adding a client-side enhancement
 * later (search input, sort headers, pagination) is a follow-up.
 */
export function TableBody({ block }: TableBodyProps) {
  if (!block || !Array.isArray(block.columns) || block.columns.length === 0) {
    return null;
  }

  return (
    <div data-post-body="table" className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            {block.columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-2 text-left font-medium text-muted-foreground border-b"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(block.rows ?? []).map((row, ri) => (
            <tr
              key={ri}
              className="border-b last:border-0 hover:bg-muted/20 transition-colors"
            >
              {block.columns.map((col) => (
                <td key={col.key} className="px-4 py-2 align-top">
                  {renderCell(row[col.key], col.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(value: unknown, type?: TableColumn["type"]): React.ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "date") {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString();
  }
  if (type === "link" && typeof value === "string") {
    const isExternal = /^https?:\/\//i.test(value);
    return (
      <Link
        href={value}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="text-primary hover:underline"
      >
        {value}
      </Link>
    );
  }
  if (type === "number" && typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}

export default TableBody;
