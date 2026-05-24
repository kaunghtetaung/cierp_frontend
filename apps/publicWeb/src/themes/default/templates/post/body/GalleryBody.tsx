import React from "react";
import Image from "next/image";

interface GalleryImage {
  mediaId?: string;
  url: string;
  alt?: { en?: string; mm?: string };
  caption?: { en?: string; mm?: string };
}

interface GalleryBodyProps {
  images?: GalleryImage[];
  currentLanguage?: "en" | "mm";
}

/**
 * Gallery body — responsive grid of images with optional captions.
 * Server component (no client-side lightbox yet); each image opens
 * in a new tab via the `<a>` wrapper. Add a client-side lightbox
 * later if/when authors ask for one.
 */
export function GalleryBody({
  images,
  currentLanguage = "en",
}: GalleryBodyProps) {
  if (!images || images.length === 0) return null;

  return (
    <div data-post-body="gallery">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img, i) => {
          const alt =
            img.alt?.[currentLanguage] || img.alt?.en || `Image ${i + 1}`;
          const caption =
            img.caption?.[currentLanguage] || img.caption?.en || null;
          return (
            <figure
              key={img.mediaId ?? `${img.url}-${i}`}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[4/3] bg-muted"
              >
                <Image
                  src={img.url}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                />
              </a>
              {caption && (
                <figcaption className="px-3 py-2 text-xs text-muted-foreground border-t">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export default GalleryBody;
