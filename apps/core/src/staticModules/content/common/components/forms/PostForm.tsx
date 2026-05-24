/**
 * @deprecated This file is a legacy duplicate. The active Post form lives at
 * `apps/core/src/staticModules/content/posts/PostForm.tsx` and is the one
 * the dynamic route uses. This stub stays because `./forms/index.ts`
 * re-exports the name; if you confirm no caller uses it, delete the entry
 * from `index.ts` and remove this file.
 *
 * See Post Schema Phase A/B/C work in `posts/PostForm.tsx` for the current
 * behaviour (Tiptap JSON body, Media-backed featured image, scheduled
 * publish, password field, SEO editor, slug uniqueness check, reading
 * time badges).
 */

'use client';

interface DeprecatedPostFormProps {
  // Intentionally permissive — this stub does not render real UI.
  [key: string]: unknown;
}

export function PostForm(_props: DeprecatedPostFormProps) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Deprecated PostForm</p>
      <p className="mt-1">
        This form was replaced by{' '}
        <code>apps/core/src/staticModules/content/posts/PostForm.tsx</code>.
        Update the importer to use the new path.
      </p>
    </div>
  );
}
