"use client";

import React, { useCallback, useEffect, useState } from "react";

interface LightboxProps {
  /**
   * Ref to the container that holds the rich-text HTML. The component
   * binds a click listener on this container and surfaces any image
   * inside it that carries `data-lightbox="true"` into the modal.
   *
   * Event delegation keeps us safe across hydration / re-render —
   * the image is rendered via `dangerouslySetInnerHTML` so we can't
   * attach React handlers directly, but the parent container is a
   * stable DOM node we can listen on.
   */
  containerRef: React.RefObject<HTMLElement | null>;
}

interface LightboxState {
  src: string;
  alt: string;
  caption: string | null;
}

/**
 * Click-to-zoom modal for images authored with the MediaAwareImage
 * Tiptap extension. The author toggles per-image via the editor's
 * floating image toolbar; the renderer marks the `<img>` with
 * `data-lightbox="true"` when enabled.
 *
 * Modal mechanics:
 *   - Click outside the image OR press Esc to close
 *   - Image scales to fit the viewport (90vw × 90vh max)
 *   - `body { overflow: hidden }` while open so the page underneath
 *     doesn't scroll on touch.
 *   - Renders inline (no portal) — sits with `position: fixed` /
 *     `z-index: 50` so it visually escapes the article container.
 */
export function Lightbox({ containerRef }: LightboxProps) {
  const [state, setState] = useState<LightboxState | null>(null);

  const close = useCallback(() => setState(null), []);

  // Delegated click handler — fires for any descendant `<img>` and
  // we check `data-lightbox` before opening.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const img = target.closest('img[data-lightbox="true"]') as
        | HTMLImageElement
        | null;
      if (!img) return;
      e.preventDefault();
      // Pull caption from the enclosing <figcaption> when present so
      // the modal mirrors what the author set in the editor.
      const figure = img.closest("figure");
      const figcap = figure?.querySelector("figcaption");
      setState({
        src: img.currentSrc || img.src,
        alt: img.alt || "",
        caption: figcap?.textContent?.trim() || null,
      });
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [containerRef]);

  // Esc-to-close + body-scroll lock while open.
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [state, close]);

  if (!state) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={state.alt || "Image viewer"}
      onClick={close}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none flex items-center justify-center transition-colors"
      >
        ×
      </button>
      <img
        src={state.src}
        alt={state.alt}
        // Stop propagation so clicking the image itself doesn't close.
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-2xl cursor-default"
      />
      {state.caption && (
        <p className="text-white/90 text-sm mt-4 max-w-[80vw] text-center">
          {state.caption}
        </p>
      )}
    </div>
  );
}

export default Lightbox;
