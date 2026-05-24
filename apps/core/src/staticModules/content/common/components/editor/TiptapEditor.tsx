'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
// StarterKit v3 already bundles Bold, Italic, Underline, Strike, Code,
// Heading, BulletList, OrderedList, ListItem, Blockquote, CodeBlock,
// HorizontalRule, HardBreak, Paragraph, Document, Text, Link, History.
// Registering any of those AGAIN throws "Duplicate extension names",
// which corrupts the schema and silently no-ops the affected toggle
// commands (this was breaking H1/H2/H3 and the list buttons).
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Paperclip,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Table as TableIcon,
  Minus,
  Pilcrow,
  CodeSquare,
  X,
  Check,
  Square,
  Maximize2,
  Type,
} from 'lucide-react';
import { Button } from '@repo/ui';
import { cn } from '@repo/ui';
import { MediaBrowserButton } from '@/components/media/MediaBrowserButton';
import type { MediaFile } from '@repo/media';

/**
 * Custom Tiptap Image node — extends the default with the
 * `mediaId` link back to the Media collection AND with presentation
 * attrs the author controls from the floating image toolbar:
 *
 *   - `align`    'left' | 'center' | 'right' (default 'center')
 *   - `bordered` boolean                    (default false)
 *   - `padded`   boolean                    (default false)
 *   - `lightbox` boolean                    (default true) — public site
 *                                           binds a click handler to
 *                                           images marked `data-lightbox`
 *                                           and opens a modal zoom.
 *   - `width`    number (percent 25..100)   (default 100)
 *   - `caption`  string                     (default null) — rendered
 *                                           inside a `<figcaption>` when
 *                                           set; doc body is per-language
 *                                           (body.en / body.mm), so the
 *                                           caption is automatically
 *                                           localized via its enclosing
 *                                           language doc.
 *
 * The DOM shape is `<figure data-tiptap-image>` wrapping an `<img>` plus
 * an optional `<figcaption>`. The publicWeb custom walker
 * (tiptap-render.ts) ignores this `renderHTML` and produces its own
 * matching markup — but the renderHTML still applies inside the editor
 * so authors see what they will get.
 */
const MediaAwareImage = Image.extend({
  // Inherit name from parent — explicit `name: 'image'` triggered a
  // duplicate-registration warning in some Tiptap versions.
  draggable: true,

  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      mediaId: {
        default: null,
        parseHTML: (el) =>
          el.getAttribute('data-media-id') ||
          el.querySelector?.('img')?.getAttribute('data-media-id') ||
          null,
        renderHTML: (attrs) =>
          attrs.mediaId ? { 'data-media-id': attrs.mediaId } : {},
      },
      align: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs) =>
          attrs.align && attrs.align !== 'center'
            ? { 'data-align': attrs.align }
            : { 'data-align': 'center' },
      },
      bordered: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-bordered') === 'true',
        renderHTML: (attrs) =>
          attrs.bordered ? { 'data-bordered': 'true' } : {},
      },
      padded: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-padded') === 'true',
        renderHTML: (attrs) =>
          attrs.padded ? { 'data-padded': 'true' } : {},
      },
      lightbox: {
        default: true,
        parseHTML: (el) => el.getAttribute('data-lightbox') !== 'false',
        renderHTML: (attrs) =>
          attrs.lightbox === false ? { 'data-lightbox': 'false' } : {},
      },
      width: {
        default: 100,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-width');
          const n = raw ? parseInt(raw, 10) : 100;
          return Number.isFinite(n) && n > 0 ? n : 100;
        },
        renderHTML: (attrs) => {
          const w = typeof attrs.width === 'number' ? attrs.width : 100;
          return { 'data-width': String(w) };
        },
      },
      caption: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-caption') || null,
        renderHTML: (attrs) =>
          attrs.caption ? { 'data-caption': attrs.caption } : {},
      },
    };
  },

  // The Image extension by default parses `<img>` tags directly. Add a
  // figure-tagged parser so docs that round-trip through HTML pick up
  // the new wrapper too. Falls through to the parent's `img` rule for
  // legacy bare-img content.
  parseHTML() {
    return [
      {
        tag: 'figure[data-tiptap-image]',
        getAttrs: (el) => {
          const fig = el as HTMLElement;
          const img = fig.querySelector('img');
          const cap = fig.querySelector('figcaption');
          return {
            src: img?.getAttribute('src') || null,
            alt: img?.getAttribute('alt') || null,
            title: img?.getAttribute('title') || null,
            mediaId:
              img?.getAttribute('data-media-id') ||
              fig.getAttribute('data-media-id') ||
              null,
            align: fig.getAttribute('data-align') || 'center',
            bordered: fig.getAttribute('data-bordered') === 'true',
            padded: fig.getAttribute('data-padded') === 'true',
            lightbox: fig.getAttribute('data-lightbox') !== 'false',
            width: (() => {
              const w = fig.getAttribute('data-width');
              const n = w ? parseInt(w, 10) : 100;
              return Number.isFinite(n) && n > 0 ? n : 100;
            })(),
            caption: cap?.textContent || null,
          };
        },
      },
      // Legacy: bare <img> with our data-media-id attribute — keeps
      // pasted / WP-imported images working without a figure wrapper.
      {
        tag: 'img[src]:not([src^="data:"])',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Record<string, unknown>;
    const align = (a.align as string) || 'center';
    const bordered = !!a.bordered;
    const padded = !!a.padded;
    const lightbox = a.lightbox !== false;
    const widthPct = typeof a.width === 'number' ? (a.width as number) : 100;
    const caption = (a.caption as string) || null;
    const mediaId = (a.mediaId as string) || null;

    const figureStyle: string[] = [];
    if (align === 'left') figureStyle.push('text-align: left', 'margin-left: 0', 'margin-right: auto');
    else if (align === 'right') figureStyle.push('text-align: right', 'margin-left: auto', 'margin-right: 0');
    else figureStyle.push('text-align: center', 'margin-left: auto', 'margin-right: auto');
    figureStyle.push(`max-width: ${widthPct}%`);

    const imgClassParts: string[] = [];
    if (this.options.HTMLAttributes && (this.options.HTMLAttributes as any).class) {
      imgClassParts.push((this.options.HTMLAttributes as any).class as string);
    }
    if (bordered) imgClassParts.push('tiptap-img-bordered');
    if (padded) imgClassParts.push('tiptap-img-padded');

    const imgStyle: string[] = ['width: 100%', 'height: auto'];
    if (bordered) imgStyle.push('border: 1px solid #d4d4d8', 'border-radius: 4px');
    if (padded) imgStyle.push('padding: 8px', 'background: #f4f4f5');

    const imgAttrs: Record<string, string> = {
      ...HTMLAttributes,
      class: imgClassParts.join(' ').trim() || undefined as any,
      style: imgStyle.join('; '),
    };
    if (mediaId) imgAttrs['data-media-id'] = mediaId;
    if (lightbox) imgAttrs['data-lightbox'] = 'true';

    const figureAttrs: Record<string, string> = {
      'data-tiptap-image': 'true',
      'data-align': align,
      'data-width': String(widthPct),
      style: figureStyle.join('; '),
    };
    if (bordered) figureAttrs['data-bordered'] = 'true';
    if (padded) figureAttrs['data-padded'] = 'true';
    if (lightbox === false) figureAttrs['data-lightbox'] = 'false';

    const children: unknown[] = [['img', imgAttrs]];
    if (caption) {
      children.push([
        'figcaption',
        { style: 'font-size: 0.875rem; color: #71717a; margin-top: 6px;' },
        caption,
      ]);
    }
    return ['figure', figureAttrs, ...(children as any)];
  },

  addCommands() {
    return {
      ...((this.parent?.() as any) ?? {}),
      updateImageAttrs:
        (attrs: Record<string, unknown>) =>
        ({ commands, state }: any) => {
          const { selection } = state;
          const node = selection.node;
          if (!node || node.type.name !== 'image') return false;
          return commands.updateAttributes('image', attrs);
        },
    } as any;
  },
});

/**
 * Tiptap "file attachment" node — block-level atom that renders as a
 * download card inside the article body. Mirrors `MediaAwareImage` for
 * non-image files (PDF, PPTX, DOCX, ZIP, etc).
 *
 * Public web renderers can read `body.html` and get a working
 * `<a download href data-media-id …>` out of the box; mobile clients can
 * resolve `mediaId` against the Media collection if they need richer
 * metadata.
 */
const MediaAwareFile = Node.create({
  name: 'mediaFile',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      href: { default: null },
      mediaId: { default: null },
      filename: { default: '' },
      mimeType: { default: null },
      size: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-media-file]',
        getAttrs: (el) => {
          const a = el as HTMLElement;
          return {
            href: a.getAttribute('href'),
            mediaId: a.getAttribute('data-media-id'),
            filename: a.getAttribute('data-filename') ?? a.textContent ?? '',
            mimeType: a.getAttribute('data-mime'),
            size: a.getAttribute('data-size')
              ? Number(a.getAttribute('data-size'))
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const filename = (node.attrs.filename as string) || 'Download file';
    const sizeBytes = node.attrs.size as number | null;
    const sizeLabel =
      typeof sizeBytes === 'number' && sizeBytes > 0
        ? formatFileSize(sizeBytes)
        : '';

    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-media-file': '',
        'data-media-id': node.attrs.mediaId ?? '',
        'data-filename': filename,
        'data-mime': node.attrs.mimeType ?? '',
        'data-size': sizeBytes ?? '',
        href: node.attrs.href ?? '#',
        download: filename,
        rel: 'noopener',
        class:
          'inline-flex items-center gap-2 my-2 px-3 py-2 rounded-md border bg-muted/30 hover:bg-muted/60 no-underline text-foreground',
      }),
      ['span', { class: 'text-sm font-medium truncate' }, filename],
      ...(sizeLabel
        ? [['span', { class: 'text-xs text-muted-foreground' }, sizeLabel] as any]
        : []),
    ];
  },
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * TiptapEditor accepts two output modes:
 * - `outputFormat: 'html'` (default) — `content` is HTML string, `onChange` emits HTML.
 * - `outputFormat: 'json'` — `content` is a Tiptap ProseMirror JSON document
 *   (object), `onChange` emits the JSON document. Recommended for new code
 *   so that mobile clients can render natively without parsing HTML.
 */
interface TiptapEditorProps {
  content?: string | Record<string, unknown>;
  onChange?: (value: any) => void;
  outputFormat?: 'html' | 'json';
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function MenuButton({ onClick, isActive, disabled, children, title }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function TiptapEditor({
  content = '',
  onChange,
  outputFormat = 'html',
  placeholder = 'Start writing...',
  editable = true,
  className,
  minHeight = '300px',
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = React.useState('');
  const [showLinkInput, setShowLinkInput] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [showImageInput, setShowImageInput] = React.useState(false);

  // Remember the most recent value we emitted out of `onUpdate` so the
  // content-prop sync `useEffect` can distinguish a genuine external
  // reset from react-hook-form's echo of our own update. Without this,
  // every toggleHeading / toggleBulletList click was being snapped
  // back because the round-trip JSON shape didn't byte-equal the
  // editor's `getJSON()` output and the effect ran `setContent` on it.
  const lastEmitted = useRef<unknown>(null);

  // Memoize the extensions array so `useEditor` doesn't tear down the
  // editor (or thrash `view.updateState`) on every parent re-render.
  // `placeholder` is the only dynamic input — bundled into the dep list.
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
        },
      }),
      MediaAwareImage.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg' },
      }),
      MediaAwareFile,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [placeholder],
  );

  const editor = useEditor({
    immediatelyRender: false,
    // Tiptap v3 defaults this to `false`, which means the React tree
    // never re-renders after a PM transaction — so toolbar buttons'
    // `isActive` state stays frozen even though the DOM updates. Set
    // it explicitly so headings / lists / marks all reflect their
    // active state in the toolbar.
    shouldRerenderOnTransaction: true,
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      const value =
        outputFormat === 'json' ? editor.getJSON() : editor.getHTML();
      // Remember what we just emitted so the prop-sync effect can
      // recognise the echo and skip the reset.
      lastEmitted.current = value;
      onChange?.(value);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-code:bg-muted prose-code:text-foreground prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-muted prose-pre:text-foreground',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-table:border-collapse',
          '[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2',
          '[&_td]:border [&_td]:border-border [&_td]:p-2'
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    // Echo from our own onChange? Skip.
    if (lastEmitted.current !== null) {
      const stillEcho =
        outputFormat === 'json'
          ? JSON.stringify(lastEmitted.current) === JSON.stringify(content)
          : lastEmitted.current === content;
      if (stillEcho) return;
    }
    if (outputFormat === 'json') {
      const current = editor.getJSON();
      if (JSON.stringify(current) === JSON.stringify(content)) return;
      editor.commands.setContent(content as any, { emitUpdate: false });
    } else if (typeof content === 'string') {
      if (content === editor.getHTML()) return;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor, outputFormat]);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageInput(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn('border rounded-lg p-4', className)} style={{ minHeight }}>
        <div className="animate-pulse bg-muted h-full rounded" />
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
          {/* Undo/Redo */}
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>

          <MenuDivider />

          {/* Text formatting */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </MenuButton>

          <MenuDivider />

          {/* Headings */}
          {/* Block type switcher. `setNode` (paragraph / heading) is
              the pattern the official Tiptap simple-editor uses — more
              reliable than `toggleHeading` chained after `focus()`,
              which silently no-ops in some selection states. The
              isActive lookup still uses the standard node-name keys. */}
          <MenuButton
            onClick={() => editor.chain().focus().setNode('paragraph').run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setNode('heading', { level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setNode('heading', { level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setNode('heading', { level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>

          <MenuDivider />

          {/* Lists — same chain pattern but with the dedicated toggle
              commands. These are the proper list toggles in v3
              (bundled in StarterKit via @tiptap/extension-list). */}
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <CodeSquare className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </MenuButton>

          <MenuDivider />

          {/* Alignment */}
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </MenuButton>

          <MenuDivider />

          {/* Link */}
          <div className="relative">
            <MenuButton
              onClick={() => {
                const previousUrl = editor.getAttributes('link').href;
                setLinkUrl(previousUrl || '');
                setShowLinkInput(!showLinkInput);
              }}
              isActive={editor.isActive('link')}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </MenuButton>
            {showLinkInput && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-50 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setLink()}
                  className="px-2 py-1 text-sm border rounded w-48 bg-background"
                  autoFocus
                />
                <MenuButton onClick={setLink} title="Apply">
                  <Check className="h-4 w-4" />
                </MenuButton>
                <MenuButton onClick={() => setShowLinkInput(false)} title="Cancel">
                  <X className="h-4 w-4" />
                </MenuButton>
              </div>
            )}
          </div>

          {/* Image — Media library picker (preferred) + URL fallback */}
          <div className="relative flex items-center">
            {/* Media library picker — inserts with mediaId + alt */}
            <MediaBrowserButton
              label=""
              variant="ghost"
              size="sm"
              config={{ allowedTypes: ['image/*'], selectionMode: 'single' }}
              onSelectMedia={(media: MediaFile[]) => {
                if (!editor || media.length === 0) return;
                const m = media[0];
                editor
                  .chain()
                  .focus()
                  .setImage({
                    src: m.url,
                    // @ts-expect-error mediaId is added by our extension
                    mediaId: m.id,
                    alt: m.alt?.en ?? m.alt?.mm ?? '',
                  })
                  .run();
              }}
            />
            {/* Plain URL fallback for arbitrary external images */}
            <MenuButton
              onClick={() => setShowImageInput(!showImageInput)}
              title="Insert image by URL (no media library)"
            >
              <LinkIcon className="h-4 w-4" />
            </MenuButton>
          </div>

          {/* File — Media library picker (any non-image type). Inserts a
              download card via the MediaAwareFile node. */}
          <div className="relative flex items-center">
            <MediaBrowserButton
              label=""
              variant="ghost"
              size="sm"
              icon={<Paperclip className="h-4 w-4" />}
              config={{
                // Browse anything; the picker is for non-image attachments,
                // but we don't restrict mime-type so authors can pick any
                // file (zip, audio, etc) without leaving the editor.
                selectionMode: 'single',
                maxFileSize: 100 * 1024 * 1024, // 100MB — PPT/PDF/ZIP can be heavy
              }}
              onSelectMedia={(media: MediaFile[]) => {
                if (!editor || media.length === 0) return;
                const m = media[0] as any;
                const filename =
                  m.name ?? m.filename ?? m.url?.split('/').pop() ?? 'download';
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'mediaFile',
                    attrs: {
                      href: m.url,
                      mediaId: m.id ?? null,
                      filename,
                      mimeType: m.mimeType ?? m.contentType ?? null,
                      size: m.size ?? m.fileSize ?? null,
                    },
                  })
                  .run();
              }}
            />
            {showImageInput && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-50 flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  className="px-2 py-1 text-sm border rounded w-48 bg-background"
                  autoFocus
                />
                <MenuButton onClick={addImage} title="Add">
                  <Check className="h-4 w-4" />
                </MenuButton>
                <MenuButton onClick={() => setShowImageInput(false)} title="Cancel">
                  <X className="h-4 w-4" />
                </MenuButton>
              </div>
            )}
          </div>

          {/* Table — insert button is always visible; the row /
              column / delete-table cluster only renders while the
              cursor is inside an existing table so the toolbar
              doesn't grow indefinitely when there's nothing to act
              on. Keyboard equivalents: Tab / Shift+Tab move between
              cells (built into the Table extension). */}
          <MenuButton onClick={insertTable} title="Insert Table">
            <TableIcon className="h-4 w-4" />
          </MenuButton>

          {editor.isActive('table') && (
            <>
              <MenuDivider />
              <MenuButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                disabled={!editor.can().addRowBefore()}
                title="Insert row above"
              >
                <span className="text-[10px] font-semibold px-1">↑+</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                disabled={!editor.can().addRowAfter()}
                title="Insert row below"
              >
                <span className="text-[10px] font-semibold px-1">↓+</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                disabled={!editor.can().deleteRow()}
                title="Delete row"
              >
                <span className="text-[10px] font-semibold px-1 text-destructive">
                  −R
                </span>
              </MenuButton>
              <MenuDivider />
              <MenuButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                disabled={!editor.can().addColumnBefore()}
                title="Insert column before"
              >
                <span className="text-[10px] font-semibold px-1">←+</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                disabled={!editor.can().addColumnAfter()}
                title="Insert column after"
              >
                <span className="text-[10px] font-semibold px-1">+→</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                disabled={!editor.can().deleteColumn()}
                title="Delete column"
              >
                <span className="text-[10px] font-semibold px-1 text-destructive">
                  −C
                </span>
              </MenuButton>
              <MenuDivider />
              <MenuButton
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                disabled={!editor.can().toggleHeaderRow()}
                isActive={editor.isActive('tableHeader')}
                title="Toggle header row"
              >
                <span className="text-[10px] font-semibold px-1">H</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().mergeOrSplit().run()}
                disabled={!editor.can().mergeOrSplit()}
                title="Merge / split cells"
              >
                <span className="text-[10px] font-semibold px-1">⇔</span>
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                disabled={!editor.can().deleteTable()}
                title="Delete entire table"
              >
                <X className="h-4 w-4 text-destructive" />
              </MenuButton>
            </>
          )}
        </div>
      )}

      {/* Image controls — visible only when an image node is selected.
           Lets the author align/border/pad/resize/caption the image
           AND toggle the click-to-zoom (lightbox) behaviour without
           hand-editing markdown / JSON. The attrs round-trip through
           ProseMirror so they survive save/reload via the same
           `bodySerialized` workaround used for the rest of the doc. */}
      {editable && editor.isActive('image') && (
        <ImageControls editor={editor} />
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="p-4"
        style={{ minHeight }}
      />
    </div>
  );
}

export default TiptapEditor;

/**
 * Floating-toolbar controls for the currently-selected image node.
 *
 * Reads the selected node's attrs out of the editor state and writes
 * back via `updateAttributes('image', ...)`. We pull width and caption
 * into local state so the slider / input doesn't blur the editor on
 * each keystroke; the change syncs back to the node on each command.
 */
interface ImageControlsProps {
  editor: any;
}

const WIDTH_PRESETS = [25, 50, 75, 100] as const;

function ImageControls({ editor }: ImageControlsProps) {
  // Pull current image attrs from the selected node. Re-runs every
  // render because the parent gates this component on
  // `editor.isActive('image')` and Tiptap re-renders on each
  // transaction (we already opt into `shouldRerenderOnTransaction`).
  const attrs = editor.getAttributes('image') as {
    align?: 'left' | 'center' | 'right';
    bordered?: boolean;
    padded?: boolean;
    lightbox?: boolean;
    width?: number;
    caption?: string | null;
  };
  const align = attrs.align ?? 'center';
  const bordered = !!attrs.bordered;
  const padded = !!attrs.padded;
  const lightbox = attrs.lightbox !== false;
  const width = typeof attrs.width === 'number' ? attrs.width : 100;
  const caption = attrs.caption ?? '';

  const update = (next: Record<string, unknown>) => {
    editor.chain().focus().updateAttributes('image', next).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-primary/5">
      <span className="text-xs font-medium text-muted-foreground mr-2">
        Image
      </span>

      {/* Alignment */}
      <MenuButton
        onClick={() => update({ align: 'left' })}
        isActive={align === 'left'}
        title="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => update({ align: 'center' })}
        isActive={align === 'center'}
        title="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => update({ align: 'right' })}
        isActive={align === 'right'}
        title="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </MenuButton>

      <MenuDivider />

      {/* Border / Padding / Lightbox toggles */}
      <MenuButton
        onClick={() => update({ bordered: !bordered })}
        isActive={bordered}
        title="Toggle border"
      >
        <Square className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => update({ padded: !padded })}
        isActive={padded}
        title="Toggle padding"
      >
        <Pilcrow className="h-4 w-4" />
      </MenuButton>
      <MenuButton
        onClick={() => update({ lightbox: !lightbox })}
        isActive={lightbox}
        title="Click-to-zoom (lightbox)"
      >
        <Maximize2 className="h-4 w-4" />
      </MenuButton>

      <MenuDivider />

      {/* Width preset buttons */}
      <span className="text-xs text-muted-foreground ml-1">Width</span>
      {WIDTH_PRESETS.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => update({ width: w })}
          className={cn(
            'h-7 px-2 text-xs rounded border transition-colors',
            width === w
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-input hover:bg-muted'
          )}
          title={`Set width to ${w}%`}
        >
          {w}%
        </button>
      ))}

      <MenuDivider />

      {/* Caption input — onBlur fallback so RHF/Tiptap don't re-render
           on every keystroke. */}
      <div className="flex items-center gap-1">
        <Type className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Caption (optional)"
          defaultValue={caption}
          onBlur={(e) => {
            const v = e.target.value.trim();
            update({ caption: v.length > 0 ? v : null });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-7 px-2 text-xs rounded border border-input bg-background w-56"
          // Re-key on the selected image's mediaId/src so the
          // default value snaps to the right caption when the author
          // selects a different image.
          key={`${attrs.caption ?? ''}|${(attrs as any).src ?? ''}`}
        />
      </div>
    </div>
  );
}
