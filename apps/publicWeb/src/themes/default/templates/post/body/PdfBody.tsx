import React from "react";
import { Download, FileText } from "lucide-react";

interface PdfFile {
  mediaId?: string;
  url: string;
  title?: { en?: string; mm?: string };
}

interface PdfBlockData {
  files: PdfFile[];
  display?: "list" | "embed-first";
}

interface PdfBodyProps {
  block?: PdfBlockData | null;
  currentLanguage?: "en" | "mm";
}

/**
 * PDF body — renders the post's `pdfBlock`.
 *
 * Two display modes:
 *   - `embed-first` — first PDF is embedded inline via <iframe> for
 *     preview, the rest are listed below as download cards.
 *   - `list` (default) — all PDFs as download cards, no embed.
 *
 * Server component. The iframe relies on the browser's built-in PDF
 * viewer; no PDF.js bundling required here. Each card has a download
 * button (plain `download` attribute) that works edge-to-edge.
 */
export function PdfBody({ block, currentLanguage = "en" }: PdfBodyProps) {
  if (!block || !Array.isArray(block.files) || block.files.length === 0) {
    return null;
  }

  const mode = block.display ?? "list";
  const titleOf = (f: PdfFile, idx: number): string =>
    f.title?.[currentLanguage] ||
    f.title?.en ||
    f.url.split("/").pop() ||
    `PDF ${idx + 1}`;

  const [first, ...rest] =
    mode === "embed-first" ? block.files : ([] as PdfFile[]);
  const listed = mode === "embed-first" ? rest : block.files;

  return (
    <div data-post-body="pdf" className="space-y-6">
      {mode === "embed-first" && first && (
        <figure className="rounded-lg border bg-card overflow-hidden">
          <iframe
            src={first.url}
            title={titleOf(first, 0)}
            className="w-full h-[calc(100vh-8rem)] min-h-[600px] bg-muted"
          />
          <figcaption className="px-4 py-3 border-t flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate">
                {titleOf(first, 0)}
              </span>
            </div>
            <a
              href={first.url}
              download
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border hover:bg-muted shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </figcaption>
        </figure>
      )}

      {listed.length > 0 && (
        <ul className="space-y-2">
          {listed.map((f, i) => (
            <li
              key={f.mediaId ?? `${f.url}-${i}`}
              className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline truncate"
                >
                  {titleOf(f, i)}
                </a>
              </div>
              <a
                href={f.url}
                download
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border hover:bg-muted shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PdfBody;
