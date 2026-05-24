import React from "react";
import { Download, FileText, Presentation } from "lucide-react";

interface SlidesBlockData {
  pdfMediaId?: string;
  pdfUrl?: string;
  pdfFilename?: string;
  pptxMediaId?: string;
  pptxUrl?: string;
  pptxFilename?: string;
  title?: { en?: string; mm?: string };
}

interface SlidesBodyProps {
  block?: SlidesBlockData | null;
  currentLanguage?: "en" | "mm";
}

/**
 * Slides body — author uploads a PDF (preview) AND optionally the
 * original PPTX (download). PDF embeds inline via <iframe>; PPTX
 * shows up as an extra download button next to it.
 *
 * Pattern matches PdfBody but adapted for the dual-file shape of
 * `slidesBlock`. No client-side conversion; the server stores both
 * files and the browser renders the PDF natively.
 */
export function SlidesBody({
  block,
  currentLanguage = "en",
}: SlidesBodyProps) {
  if (!block || !block.pdfUrl) return null;

  const title =
    block.title?.[currentLanguage] ||
    block.title?.en ||
    block.pdfFilename ||
    "Slides";

  return (
    <figure
      data-post-body="slides"
      className="rounded-lg border bg-card overflow-hidden"
    >
      <iframe
        src={block.pdfUrl}
        title={title}
        className="w-full h-[calc(100vh-8rem)] min-h-[600px] bg-muted"
      />
      <figcaption className="px-4 py-3 border-t flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Presentation className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={block.pdfUrl}
            download
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border hover:bg-muted"
          >
            <FileText className="h-3.5 w-3.5" />
            Download PDF
          </a>
          {block.pptxUrl && (
            <a
              href={block.pptxUrl}
              download
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" />
              Download PPTX
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

export default SlidesBody;
