import React from "react";
import { Play, Video as VideoIcon } from "lucide-react";

interface VideoItem {
  mediaId?: string;
  url: string;
  source: "upload" | "youtube" | "vimeo" | "external";
  title?: { en?: string; mm?: string };
  thumbnailUrl?: string;
  durationSec?: number;
}

interface VideoBlockData {
  items: VideoItem[];
  display?: "list" | "embed-first";
}

interface VideoBodyProps {
  block?: VideoBlockData | null;
  currentLanguage?: "en" | "mm";
}

/**
 * Video body — handles uploaded files + external embeds.
 *
 * `embed-first` mode: first video plays inline (HTML5 <video> for
 * uploads, <iframe> for YouTube/Vimeo), the rest list as cards.
 * `list` mode: every video as a thumbnail card; clicking opens the
 * external URL in a new tab. Server component — no client-side
 * player abstraction yet (HTML5 controls are sufficient for self-
 * hosted; embeds are iframe-only).
 */
export function VideoBody({ block, currentLanguage = "en" }: VideoBodyProps) {
  if (!block || !Array.isArray(block.items) || block.items.length === 0) {
    return null;
  }
  const mode = block.display ?? "list";

  const titleOf = (v: VideoItem, idx: number): string =>
    v.title?.[currentLanguage] || v.title?.en || `Video ${idx + 1}`;

  const renderEmbed = (v: VideoItem) => {
    if (v.source === "youtube" || v.source === "vimeo") {
      return (
        <iframe
          src={normalizeEmbedUrl(v.url, v.source)}
          title={titleOf(v, 0)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full aspect-video bg-black"
        />
      );
    }
    if (v.source === "external") {
      return (
        <iframe
          src={v.url}
          title={titleOf(v, 0)}
          allowFullScreen
          className="w-full aspect-video bg-black"
        />
      );
    }
    return (
      <video
        controls
        preload="metadata"
        className="w-full aspect-video bg-black"
        src={v.url}
        poster={v.thumbnailUrl}
      />
    );
  };

  const [first, ...rest] =
    mode === "embed-first" ? block.items : ([] as VideoItem[]);
  const listed = mode === "embed-first" ? rest : block.items;

  return (
    <div data-post-body="video" className="space-y-6">
      {mode === "embed-first" && first && (
        <figure className="rounded-lg border bg-card overflow-hidden">
          {renderEmbed(first)}
          <figcaption className="px-4 py-3 border-t flex items-center gap-2">
            <VideoIcon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">
              {titleOf(first, 0)}
            </span>
          </figcaption>
        </figure>
      )}

      {listed.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listed.map((v, i) => (
            <li
              key={v.mediaId ?? `${v.url}-${i}`}
              className="rounded-md border bg-card overflow-hidden"
            >
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-video bg-muted"
              >
                {v.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt={titleOf(v, i)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Play className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </a>
              <div className="px-3 py-2 text-xs">
                <p className="font-medium truncate">{titleOf(v, i)}</p>
                {typeof v.durationSec === "number" && (
                  <p className="text-muted-foreground mt-0.5">
                    {formatDuration(v.durationSec)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function normalizeEmbedUrl(
  url: string,
  source: "youtube" | "vimeo",
): string {
  // YouTube watch URL → embed URL.
  if (source === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  // Vimeo numeric ID → player.
  if (source === "vimeo") {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  return url;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default VideoBody;
