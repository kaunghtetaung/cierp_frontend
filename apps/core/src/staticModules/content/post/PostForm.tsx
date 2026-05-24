"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@repo/ui";
import {
  Input,
  Button,
  Checkbox,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Switch,
} from "@repo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { toastSuccess, toastError } from "@repo/utils";
import {
  Loader2,
  Save,
  X,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
  Send,
  Building2,
  Calendar as CalendarIcon,
  Eye,
  Globe,
  Lock,
  Shield,
  KeyRound,
  Folder,
  Hash,
  ChevronDown,
  ChevronLeft,
  ChevronsRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { createPostSchema, type CreatePostFormData } from "../common/schemas";
import {
  createPost,
  updatePost,
  getPostBySlug,
  getRelatedPosts,
  getPosts,
  getPostTypeReference,
  getPostTypeById,
} from "../common/actions";
import type { Post, ProseMirrorDoc } from "../common/types";
import { generateSlug } from "../common/utils";
import { TiptapEditor } from "../common/components/editor/TiptapEditor";
import { MediaBrowserButton } from "@/components/media/MediaBrowserButton";
import type { MediaFile } from "@repo/media";
import {
  extractPlainText,
  countWords,
  estimateReadingMinutes,
} from "./post-utils";
import { SeoEditor } from "./SeoEditor";
import { RelatedPostsPicker } from "./RelatedPostsPicker";
import { AccessControlPicker } from "./AccessControlPicker";
import { RevisionsPanel } from "./RevisionsPanel";
import { CategoryPicker } from "./CategoryPicker";
import { TagPicker } from "./TagPicker";
import { DepartmentPicker } from "./DepartmentPicker";
import { ContentTypeSelector } from "./ContentTypeSelector";
import { SlidesBlockField } from "./SlidesBlockField";
import { CustomFieldsEditor } from "./CustomFieldsEditor";
import { LessonAudienceSelector } from "./LessonAudienceSelector";
import { EventDetailsCard } from "./EventDetailsCard";
import { AnnouncementDetailsCard } from "./AnnouncementDetailsCard";
import { PageDetailsCard } from "./PageDetailsCard";
import { PageSettingsForm } from "./PageSettingsForm";
import { TemplatePicker } from "./TemplatePicker";
import type { AttributeDefinition } from "../common/types";
import { PdfBlockField } from "./PdfBlockField";
import { TableBlockField } from "./TableBlockField";
import { VideoBlockField } from "./VideoBlockField";
import { useDraftAutosave, formatAutosaveStatus } from "./useDraftAutosave";

/** Empty Tiptap ProseMirror doc — used as default body content. */
const EMPTY_DOC: ProseMirrorDoc = { type: "doc", content: [] };

/** Convert ISO datetime to value compatible with <input type="datetime-local">. */
function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // datetime-local expects YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local?: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

interface PostFormProps {
  mode: "create" | "edit";
  initialData?: Partial<Post>;
  onSuccess?: (post: Post) => void;
  onCancel?: () => void;
  /**
   * Optional title shown at the top of the `Content metadata` card,
   * paired with `onBack`. Lets the parent page surface "Create New
   * Post" / "Edit Post" + a back button inside the form's first card
   * instead of as a separate page-level header. When omitted, no
   * title row is rendered.
   */
  formTitle?: string;
  formSubtitle?: string;
  /** Called when the back button is clicked. Hides the back button if not provided. */
  onBack?: () => void;
}

export function PostForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
  formTitle,
  formSubtitle,
  onBack,
}: PostFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `?postTypeSlug=news` from DefaultPostListView's "+ New" button. Used
  // once on mount to prefill the PostType picker so the author lands
  // already typed-in to the right form variant. Only honored in `create`
  // mode and when no initialData postType is set.
  const prefillPostTypeSlug = searchParams?.get("postTypeSlug") ?? null;
  const [isPending, startTransition] = useTransition();
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [langTab, setLangTab] = useState<"en" | "mm">("en");

  // Tracks whether the user has any publishable departments. The form is
  // disabled when this is `false` so a contributor without rights can't
  // accidentally submit a draft that nobody could ever publish.
  const [hasPublishableDepartments, setHasPublishableDepartments] = useState<
    boolean | null
  >(null); // null = still loading

  // True iff the requester carries a systemAdmin / organizationAdmin
  // role for the current org. Drives the "Organization-level (no
  // department)" toggle below — only those roles can author a post
  // without picking a department. Reported by DepartmentPicker after
  // it loads `/core/departments/publishable`.
  const [canPublishOrgLevel, setCanPublishOrgLevel] = useState(false);

  // Settings sidebar open/closed. Default closed so authors land in
  // distraction-free editing mode; the right-edge gear handle is
  // always visible to bring the sheet back. The sheet OVERLAYS the
  // main canvas (doesn't push) and is portaled to the AppLayout
  // `<main>` element so it stays at page-editor level.
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Portal mount target for the settings sheet. Becomes non-null once
  // the `<aside>` containing the sheet renders; setting it via ref
  // callback re-renders this form, at which point each settings card
  // routes itself into the sheet via `sidebarPortal()`.
  const [sheetMountEl, setSheetMountEl] = useState<HTMLDivElement | null>(null);

  // Page-editor `<main>` element (from AppLayout) — used as the portal
  // target for the settings sheet so it overlays the WHOLE editor
  // area, not just this form's fieldset. Found at mount via
  // `document.querySelector('main')`; we also force the element to
  // `position: relative` so the sheet's absolute positioning anchors
  // to it.
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const m = document.querySelector('main') as HTMLElement | null;
    if (!m) return;
    if (getComputedStyle(m).position === 'static') {
      m.style.position = 'relative';
    }
    setMainEl(m);
  }, []);

  // Show the floating gear handle (anchored to <main>'s right edge)
  // only when the form has been scrolled past its top header — at the
  // top of the form the header's "Settings" button is visible, so a
  // duplicate floating handle is redundant.
  const [showFloatingHandle, setShowFloatingHandle] = useState(false);
  useEffect(() => {
    if (!mainEl) return;
    const onScroll = () => {
      setShowFloatingHandle(mainEl.scrollTop > 80);
    };
    mainEl.addEventListener('scroll', onScroll);
    onScroll();
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, [mainEl]);

  // Toggle state. Default ON when editing an existing post that already
  // has no department (covers org-level docs created via mongosh) so
  // the picker doesn't re-appear and confuse the editor.
  const [isOrgLevel, setIsOrgLevel] = useState<boolean>(
    Boolean(initialData && !initialData.departmentId),
  );

  // ───────── PostType state — drives the "Post as" dropdown and the
  // CustomFieldsEditor below. We load the lightweight reference list
  // once on mount, and lazily fetch the full document (which carries
  // `attributes`) whenever the user picks a different type.
  const [postTypes, setPostTypes] = useState<
    Array<{ id: string; label: string; value: string; slug: string }>
  >([]);
  const [postTypeAttributes, setPostTypeAttributes] = useState<
    AttributeDefinition[]
  >([]);
  const [loadingPostTypeAttrs, setLoadingPostTypeAttrs] = useState(false);

  // When the form runs as a full-page route (no parent passes onCancel),
  // the Cancel button just navigates back.
  const handleCancel = onCancel ?? (() => router.back());

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initialData?.title || { en: "", mm: "" },
      slug: initialData?.slug || "",
      excerpt: initialData?.excerpt || { en: "", mm: "" },
      body: initialData?.body || { en: EMPTY_DOC, mm: EMPTY_DOC },
      contentFormat: initialData?.contentFormat || "json",
      contentType: initialData?.contentType || "article",
      pdfBlock: initialData?.pdfBlock,
      slidesBlock: initialData?.slidesBlock,
      tableBlock: initialData?.tableBlock,
      videoBlock: initialData?.videoBlock,
      featuredImage: initialData?.featuredImage,
      // Backend `post.repository.findById` populates postTypeId into a
      // `{_id, slug, name, customAttributes}` object. The form expects
      // a plain string id (Zod schema declares it as `z.string()`), so
      // extract the id whenever the loaded shape is populated.
      postTypeId:
        typeof initialData?.postTypeId === 'string'
          ? initialData.postTypeId
          : (initialData?.postTypeId as any)?._id ||
            (initialData?.postTypeId as any)?.id,
      postTypeSlug: (initialData as any)?.postTypeSlug,
      categoryIds: initialData?.categoryIds || [],
      customFields: initialData?.customFields || [],
      lessonContext: initialData?.lessonContext,
      eventContext: initialData?.eventContext,
      announcementContext: initialData?.announcementContext,
      tagIds: initialData?.tagIds || [],
      departmentId: initialData?.departmentId,
      visibility: initialData?.visibility || "Public",
      allowComments: initialData?.allowComments ?? true,
      isFeatured: initialData?.isFeatured || false,
      status: initialData?.status || "Draft",
      // Page-as-post (only meaningful when PostType.slug === 'page')
      parentId: (initialData as any)?.parentId ?? null,
      orderInParent: (initialData as any)?.orderInParent ?? 0,
      isHomePage: (initialData as any)?.isHomePage ?? false,
      showInNavigation: (initialData as any)?.showInNavigation ?? false,
      showBreadcrumbs: (initialData as any)?.showBreadcrumbs ?? true,
      showTitle: (initialData as any)?.showTitle ?? true,
      showFeaturedImage: (initialData as any)?.showFeaturedImage ?? false,
      template: (initialData as any)?.template || "default",
      templateId: (initialData as any)?.templateId ?? null,
      layoutMode: (initialData as any)?.layoutMode || "tiptap",
      bodyTiptap: (initialData as any)?.bodyTiptap,
      sectionRefs: (initialData as any)?.sectionRefs || [],
      layout: (initialData as any)?.layout,
    },
  });

  const { watch, setValue } = form;
  const titleEn = watch("title.en");

  // Auto-generate slug from English title
  useEffect(() => {
    if (autoSlug && titleEn) {
      setValue("slug", generateSlug(titleEn));
    }
  }, [titleEn, autoSlug, setValue]);

  // ───────── PostType list — fetched once on mount.
  // Drives the "Post as" dropdown.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getPostTypeReference({ limit: 200 });
      if (!cancelled && r.success && Array.isArray(r.data)) {
        setPostTypes(
          r.data as Array<{
            id: string;
            label: string;
            value: string;
            slug: string;
          }>,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ───────── Fetch the chosen PostType's `attributes` when the picker
  // changes. We can't get the attributes from the lightweight /ref
  // payload — we need the full document, so this is a second request.
  const watchedPostTypeId = watch("postTypeId");
  useEffect(() => {
    if (!watchedPostTypeId) {
      setPostTypeAttributes([]);
      return;
    }
    let cancelled = false;
    setLoadingPostTypeAttrs(true);
    (async () => {
      try {
        const r = await getPostTypeById(watchedPostTypeId);
        if (cancelled) return;
        if (r.success && r.data) {
          const attrs =
            (((r.data as any).customAttributes ??
              (r.data as any).attributes) as AttributeDefinition[]) || [];
          setPostTypeAttributes(attrs);
        } else {
          setPostTypeAttributes([]);
        }
      } finally {
        if (!cancelled) setLoadingPostTypeAttrs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [watchedPostTypeId]);

  // Sync the denormalized `postTypeSlug` field whenever the id changes
  // and the matching list entry is loaded. Keeps writes-through clean.
  useEffect(() => {
    if (!watchedPostTypeId || postTypes.length === 0) return;
    const match = postTypes.find((p) => p.id === watchedPostTypeId);
    if (match) setValue("postTypeSlug", match.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPostTypeId, postTypes]);

  // Prefill from `?postTypeSlug=…` query param — fires once after the
  // postTypes list loads, only in create mode, and only if no PostType
  // is already selected. Lets the sidebar "+ New News" button drop the
  // author straight into the right form variant.
  useEffect(() => {
    if (mode !== "create") return;
    if (!prefillPostTypeSlug || postTypes.length === 0) return;
    if (watchedPostTypeId) return;
    const match = postTypes.find((p) => p.slug === prefillPostTypeSlug);
    if (match) {
      setValue("postTypeId", match.id, { shouldDirty: false });
      setValue("postTypeSlug", match.slug, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postTypes, prefillPostTypeSlug, mode]);

  // Slug of the currently chosen PostType — drives whether the
  // LessonAudienceSelector renders. Derived from the cached postTypes list.
  const selectedPostTypeSlug = useMemo(() => {
    // Prefer the denormalized `postTypeSlug` on initialData — the
    // backend Post doc carries it as a plain string and it's available
    // even before the `postTypes` ref list resolves. Falls back to the
    // postTypes lookup for create mode where there's no initialData.
    //
    // The lookup is also defensive about `watchedPostTypeId` being a
    // populated object instead of a string (happens transiently in
    // edit mode if anything bypasses the initializer above), so it
    // extracts `_id` / `id` before comparing.
    const denorm = (initialData as any)?.postTypeSlug;
    if (denorm) return denorm;
    if (!watchedPostTypeId) return undefined;
    const idStr =
      typeof watchedPostTypeId === 'string'
        ? watchedPostTypeId
        : (watchedPostTypeId as any)?._id || (watchedPostTypeId as any)?.id;
    return postTypes.find((p) => p.id === idStr)?.slug;
  }, [watchedPostTypeId, postTypes, initialData]);

  // ObjectId of the Lesson PostType — passed to the prerequisite picker so
  // the backend's `/post/ref` filter can scope candidates to Lesson posts
  // only. Resolved from the same cached list (lookup by slug).
  const lessonPostTypeId = useMemo(() => {
    return postTypes.find((p) => p.slug === "lesson")?.id;
  }, [postTypes]);

  // Lock visibility for Lesson PostType: a lesson is inherently restricted
  // to its (subject, batches) audience — not a free-form public/private
  // choice. Force the field to 'Restricted' whenever the selected PostType
  // is Lesson, and restore to 'Public' when the user picks a different
  // PostType (so the regular picker re-enables itself with a sane default).
  useEffect(() => {
    const current = form.getValues("visibility");
    if (selectedPostTypeSlug === "lesson") {
      if (current !== "Restricted") {
        setValue("visibility", "Restricted", { shouldDirty: true });
      }
      // Lesson posts always require a department — force the
      // org-level toggle off so the picker comes back. Backend
      // mirrors this constraint and rejects departmentless lessons.
      if (isOrgLevel) {
        setIsOrgLevel(false);
      }
    } else if (current === "Restricted") {
      setValue("visibility", "Public", { shouldDirty: true });
    }
  }, [selectedPostTypeSlug, form, setValue, isOrgLevel]);

  // When the org-level toggle flips ON, clear any selected department
  // so the form submits with `departmentId: undefined`. Stripping is
  // also enforced backend-side for safety.
  useEffect(() => {
    if (isOrgLevel) {
      setValue("departmentId", undefined, { shouldDirty: true });
    }
  }, [isOrgLevel, setValue]);

  // ---------- Phase C: derived fields & async checks ----------

  const watchedBodyEn = watch("body.en");
  const watchedTitleEn = watch("title.en");
  const watchedContentType = (watch("contentType") ?? "article") as
    | "article"
    | "pdf"
    | "table"
    | "gallery"
    | "video"
    | "slides";
  const watchedExcerptEn = watch("excerpt.en");
  const watchedSlug = watch("slug");
  const watchedStatus = watch("status");
  const watchedVisibility = watch("visibility");
  const watchedMetaTitle = watch("metaTitle");
  const watchedMetaDescription = watch("metaDescription");
  const watchedMetaKeywords = watch("metaKeywords");
  const watchedScheduledAt = watch("scheduledAt");
  const watchedFeaturedImage = watch("featuredImage");
  const watchedOgImage = watch("ogImage");
  const watchedCanonicalUrl = watch("canonicalUrl");
  const watchedGalleryImages = watch("galleryImages") ?? [];

  // ---------- Phase E-6: autosave (Draft only, edit mode only) ----------
  const watchedAll = watch();
  const isDirty = form.formState.isDirty;
  const autosaveStatus = useDraftAutosave({
    postId: initialData?._id,
    data: watchedAll as CreatePostFormData,
    isDirty,
    enabled: mode === "edit" && watchedStatus === "Draft",
  });

  // Reading time + word count from English body (the canonical authoring lang)
  const bodyText = React.useMemo(
    () => extractPlainText(watchedBodyEn),
    [watchedBodyEn],
  );
  const wordCount = React.useMemo(() => countWords(bodyText), [bodyText]);
  const readingMinutes = React.useMemo(
    () => estimateReadingMinutes(wordCount),
    [wordCount],
  );

  // Slug uniqueness probe — debounced, only when user is editing slug manually
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");
  useEffect(() => {
    if (autoSlug || !watchedSlug || watchedSlug.length < 2) {
      setSlugStatus("idle");
      return;
    }
    // Skip probe if slug is unchanged from the initial value (edit mode)
    if (mode === "edit" && initialData?.slug === watchedSlug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const r = await getPostBySlug(watchedSlug);
        if (r.success && r.data) {
          // Found a post with this slug — taken unless it's the same post in edit mode
          if (
            mode === "edit" &&
            (r.data as any)._id === (initialData as any)?._id
          ) {
            setSlugStatus("available");
          } else {
            setSlugStatus("taken");
          }
        } else {
          setSlugStatus("available");
        }
      } catch {
        setSlugStatus("error");
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [watchedSlug, autoSlug, mode, initialData]);

  // Auto-fill metaTitle / metaDescription on first change to title/excerpt
  // (skip if user has typed something custom). This is best-effort only —
  // the SEO editor preview also falls back to title/excerpt at render time
  // even when metaTitle/Description are empty.

  // Surface form validation failures — without this, react-hook-form's
  // default `handleSubmit(onSubmit)` silently swallows invalid submissions
  // (the click "does nothing" because validation returns early). Lists the
  // first 3 dotted field paths so the author knows what's blocking save.
  const onInvalid = (errors: any) => {
    const flatten = (e: any, prefix = ''): string[] => {
      const out: string[] = [];
      for (const k of Object.keys(e || {})) {
        const v = e[k];
        if (!v) continue;
        const path = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && 'message' in v && v.message) {
          out.push(path);
        } else if (typeof v === 'object') {
          out.push(...flatten(v, path));
        }
      }
      return out;
    };
    const all = flatten(errors);
    const shown = all.slice(0, 3).join(', ');
    const rest = all.length - Math.min(3, all.length);
    toastError(
      shown
        ? `Please fix: ${shown}${rest > 0 ? ` (+${rest} more)` : ''}`
        : 'Please fill out all required fields before saving',
    );
  };

  const onSubmit = (data: CreatePostFormData) => {
    // ---- Phase C client-side guards ----
    if (data.status === "Scheduled") {
      if (!data.scheduledAt) {
        toastError("Schedule time is required when status is Scheduled");
        return;
      }
      if (new Date(data.scheduledAt).getTime() <= Date.now()) {
        toastError("Schedule time must be in the future");
        return;
      }
    }
    if (data.visibility === "Password") {
      if (mode === "create" && !data.password) {
        toastError("Password is required for password-protected posts");
        return;
      }
    } else {
      // Don't send a password when visibility doesn't require one — avoid
      // accidentally setting a stale password from a previous edit cycle.
      data.password = undefined;
    }
    if (slugStatus === "taken") {
      toastError("This slug is already in use — choose another.");
      return;
    }

    // Workaround for a Next.js Server Action RSC encoding bug: any
    // property literally named `attrs` on a plain object loses its
    // value across the browser → server boundary (the decoded property
    // ends up as `attrs: undefined`, JSON.stringify then drops it).
    // This wiped the `src` off every Tiptap image node, the `href` off
    // every link mark, the `level` off every heading, the colspan/
    // rowspan off every table cell — every author-set attr disappeared
    // on save and the image/link/heading/table came back broken.
    //
    // The fix: marshall the body to a JSON string here and ship it in
    // a sibling field (`bodySerialized` + `_bodyIsStringified` flag).
    // The server-action wrapper in `post.actions.ts` JSON.parses it
    // back onto `body` before passing on. Strings round-trip through
    // the RSC encoder cleanly.
    const dataAny = data as any;
    if (dataAny.body && typeof dataAny.body === 'object') {
      dataAny.bodySerialized = JSON.stringify(dataAny.body);
      dataAny._bodyIsStringified = true;
    }

    startTransition(async () => {
      try {
        let result;
        if (mode === "create") {
          result = await createPost(data as any);
        } else if (initialData?._id) {
          result = await updatePost(initialData._id, data as any);
        } else {
          throw new Error("Post ID is required for update");
        }

        if (result.success && result.data) {
          toastSuccess(
            mode === "create"
              ? "Post created successfully"
              : "Post updated successfully",
          );
          onSuccess?.(result.data);
        } else {
          toastError(result.error || "Failed to save post");
        }
      } catch (error) {
        console.error("Post form error:", error);
        toastError("An unexpected error occurred");
      }
    });
  };

  // Page-mode card ordering — used to give each Card a deterministic
  // flex `order` so the page-author flow lands on Title first. For
  // non-page post types, `pageOrder()` returns an empty string so the
  // source-order rendering is preserved (avoids any visual change for
  // article / lesson / news / etc.).
  //
  // Tailwind JIT only detects literal class names — `order-${n}`
  // template strings are NOT scanned, so we hard-code the full class
  // string for each slot.
  const ORDER_CLASS: Record<number, string> = {
    1: "order-1",
    2: "order-2",
    3: "order-3",
    4: "order-4",
    5: "order-5",
    6: "order-6",
    7: "order-7",
    8: "order-8",
  };
  // All postTypes (article / lesson / news / announcement / page)
  // share the same form-sheet layout: stripped-chrome main canvas
  // + right-overlay settings sheet. The variable name is kept for
  // diff readability; treat it as "use the sheet layout".
  const isPageMode = true;
  const pageOrder = (n: number): string =>
    isPageMode ? (ORDER_CLASS[n] ?? "") : "";

  // Card ordering helper for the main canvas. For page postType the
  // canvas is a single-column flex stack; settings cards are pulled
  // out of source flow via portal (see `sidebarPortal()` below) and
  // don't participate in this layout.
  const mainCol = (n: number): string =>
    isPageMode ? (ORDER_CLASS[n] ?? "") : "";

  // Production-grade section shell used by every chrome-less main-canvas
  // group (Body / Lesson audience / Event details / Announcement
  // details / Custom fields). Renders an uppercase eyebrow label and
  // a top border so the eye can scan the form's structure even
  // without surrounding Cards. Used in place of `<Card><CardHeader><CardTitle/>`
  // for sections where the production-grade flat layout applies.
  const SectionShell: React.FC<{
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
  }> = ({ title, description, actions, className = "", children }) => (
    <section className={`border-t pt-6 mt-6 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );

  // Routes a settings card to either:
  //   • inline (non-page postTypes): rendered at its source position
  //   • sheet portal (page postType): mounted into the absolute-
  //     positioned `<aside>` so it overlays the main canvas without
  //     consuming canvas width
  // On first render the portal target is null — for page mode we
  // return null so the card doesn't briefly flash inline before
  // jumping to the sheet on the next render. The sheet's ref-callback
  // sets `sheetMountEl`, which forces a re-render that fills the sheet.
  // The sheet's own `[&_.grid]` override flattens any inner multi-
  // column grids the card uses (e.g. Publishing's lg:grid-cols-12)
  // because the sheet is only ~360px wide.
  const sidebarPortal = (children: React.ReactNode): React.ReactNode => {
    if (!isPageMode) return children;
    if (!sheetMountEl) return null;
    return createPortal(children, sheetMountEl);
  };

  // Featured-image picker — shared between the inline non-page render
  // (right column of `Content metadata` card) and the page-mode
  // sidebar card. Pulled out so the same JSX renders in either slot
  // without duplication.
  const featuredImageField = (
    <FormField
      control={form.control}
      name="featuredImage"
      render={({ field }) => (
        <FormItem className="space-y-2">
          {!isPageMode && <FormLabel>Featured Image</FormLabel>}
          {field.value?.url ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
                <img
                  src={field.value.url}
                  alt={field.value.alt?.en || field.value.alt?.mm || "Featured"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => field.onChange(undefined)}
                  title="Remove featured image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <MediaBrowserButton
                label="Replace"
                variant="outline"
                size="sm"
                className="w-full"
                config={{
                  allowedTypes: ["image/*"],
                  selectionMode: "single",
                }}
                onSelectMedia={(media: MediaFile[]) => {
                  const m = media[0];
                  field.onChange({
                    mediaId: m.id,
                    url: m.url,
                    alt: m.alt,
                    caption: m.caption,
                  });
                }}
              />
              <Input
                placeholder="Alt text (EN)"
                value={field.value.alt?.en ?? ""}
                onChange={(e) =>
                  field.onChange({
                    ...field.value,
                    alt: { ...field.value?.alt, en: e.target.value },
                  })
                }
              />
              <Input
                placeholder="အစားထိုးစာသား (MM)"
                value={field.value.alt?.mm ?? ""}
                onChange={(e) =>
                  field.onChange({
                    ...field.value,
                    alt: { ...field.value?.alt, mm: e.target.value },
                  })
                }
              />
            </div>
          ) : (
            <FormControl>
              <div className="relative aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 p-3">
                <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground text-center">
                  No featured image yet
                </p>
                <MediaBrowserButton
                  label="Choose image"
                  variant="outline"
                  size="sm"
                  icon={<ImagePlus className="h-4 w-4 mr-2" />}
                  config={{
                    allowedTypes: ["image/*"],
                    selectionMode: "single",
                  }}
                  onSelectMedia={(media: MediaFile[]) => {
                    const m = media[0];
                    field.onChange({
                      mediaId: m.id,
                      url: m.url,
                      alt: m.alt,
                      caption: m.caption,
                    });
                  }}
                />
              </div>
            </FormControl>
          )}
          <FormDescription className="text-[11px]">
            Recommended 1200×675 (16:9). Used as the post thumbnail and OG
            image.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
        {/* Page header — `Create New Post` / `Edit Post` + back button.
             Sits OUTSIDE the form's main Card so the editing surface
             starts at Title. Only renders when the parent route
             provides `formTitle`. */}
        {formTitle && (
          <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-4 pb-4 flex items-end justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight truncate leading-tight">
                {formTitle}
              </h1>
              {formSubtitle && (
                <p className="text-sm text-muted-foreground leading-snug">
                  {formSubtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? "Hide settings" : "Show settings"}
              >
                <SettingsIcon className="h-4 w-4 mr-1" />
                Settings
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  isPending ||
                  // Only gate CREATE on publish rights. For edits, the
                  // user reached this form because they already have
                  // access to the existing post — backend re-validates
                  // on update anyway. Without this carve-out, an org
                  // admin editing a page (department-less) gets stuck
                  // with a dead Save button when their session doesn't
                  // surface `canPublishOrgLevel` for any reason.
                  (mode === "create" &&
                    hasPublishableDepartments === false &&
                    !canPublishOrgLevel)
                }
                title={
                  mode === "create" &&
                  hasPublishableDepartments === false &&
                  !canPublishOrgLevel
                    ? "You don't have publish rights in any department"
                    : undefined
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {mode === "create" ? "Create" : "Save"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <fieldset
          disabled={
            mode === "create" &&
            hasPublishableDepartments === false &&
            !canPublishOrgLevel
          }
          // Fieldset is styled as ONE Card body — Title / Excerpt /
          // Slug + Body editor + type-specific details + Custom fields
          // all sit inside a single rounded outline with consistent
          // padding. SectionShell's `border-t` lines provide internal
          // dividers between groups. The settings sheet still portals
          // to AppLayout `<main>` so the canvas chrome stays focused
          // on the editor.
          className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 px-6 shadow-sm disabled:opacity-60 disabled:pointer-events-none"
        >
          {/* (Settings toggle moved to a tab handle inside the sheet's
               portal — see below. Removed from the form's top row.) */}

          {/* ───────── Settings sheet — absolute overlay, scoped to <main> ─────────
              Portaled into the AppLayout `<main>` element so the sheet
              overlays the ENTIRE page-editor area (not just this form's
              fieldset). Stays at page-editor level — never reaches
              `document.body`. Settings cards (Featured Image /
              Publishing / Audience / SEO / Engagement) flow into the
              `setSheetMountEl` div via `sidebarPortal()`.

              The toggle is a small TAB HANDLE — pinned to the right
              edge of `<main>` when closed, pinned to the LEFT edge of
              the sheet when open. Only the left corners are rounded;
              the right side is flush with whichever vertical edge it
              sits against. */}
          {isPageMode && mainEl && createPortal(
            <>
              {/* Click-outside backdrop — invisible overlay that fills
                  `<main>` when the sheet is open. Clicking it closes
                  the sheet. The sheet (z-20) and floating handle
                  (z-30) sit above this layer (z-10) so they remain
                  interactive. */}
              {sidebarOpen && (
                <div
                  className="absolute inset-0 z-10"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden
                />
              )}

              {/* Floating tab handle — only shown after the user has
                  scrolled past the top form header (the Settings
                  button there handles the "above-the-fold" case).
                  Hidden while sheet is open AND when at the top. */}
              {(showFloatingHandle || sidebarOpen) && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className={`absolute z-30 top-[100px] transition-[right] duration-200 rounded-l-md rounded-r-none border border-border border-r-0 bg-background shadow-md p-2 hover:bg-muted ${
                    sidebarOpen ? "right-[400px]" : "right-0"
                  }`}
                  aria-label={sidebarOpen ? "Hide settings" : "Show settings"}
                  title={sidebarOpen ? "Hide settings" : "Show settings"}
                >
                  {sidebarOpen ? (
                    <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}

              <aside
                className={`absolute right-0 top-0 bottom-0 w-full max-w-[400px] z-20 overflow-y-auto bg-background border-l border-border shadow-2xl transition-transform duration-200 ${
                  sidebarOpen
                    ? "translate-x-0"
                    : "translate-x-full pointer-events-none"
                }`}
                aria-hidden={!sidebarOpen}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border">
                  <span className="text-sm font-semibold">Page settings</span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                    aria-label="Close settings sheet"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  ref={setSheetMountEl}
                  className="divide-y divide-border border-b border-border"
                />
              </aside>
            </>,
            mainEl,
          )}

          {/* ───────── Featured Image (page mode → sheet) ─────────
              First item in the sheet's divider list. Keeps its own
              `p-4` padding so the thumbnail / dropzone has breathing
              room — collapsibles below it run edge-to-edge.  */}
          {isPageMode &&
            sidebarPortal(<div className="p-4">{featuredImageField}</div>)}

          {/* ───────── Publishing — collapsible, stacked fields ─────────
              In the sheet via `sidebarPortal()`. Same `<details>`
              treatment as SEO / Engagement: closed-by-default summary
              with title + chevron; expanded body lists Department /
              Status / Schedule stacked single-column. No grid columns
              inside since the sheet is narrow. */}
          {sidebarPortal(
            <details name="settingsAccordion" className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                <span className="font-semibold text-sm">Publishing</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-4">
                <p className="text-[11px] text-muted-foreground">
                  {watchedStatus === "Draft" &&
                    "Saved as draft until you publish."}
                  {watchedStatus === "Published" && "Live the moment you save."}
                  {watchedStatus === "Scheduled" &&
                    watchedScheduledAt &&
                    `Goes live ${new Date(watchedScheduledAt).toLocaleString()}`}
                  {watchedStatus === "Scheduled" &&
                    !watchedScheduledAt &&
                    "Pick a future date and time below."}
                </p>
                <div className="space-y-4">
                  {/* Post as — picks one of the tenant's PostType records.
                  The chosen type's `attributes` drive the Custom fields card
                  rendered further down.

                  When the sidebar's "+ New <Type>" button brought us here
                  (`?postTypeSlug=…` query param) OR we're in edit mode, the
                  type is already decided — we hide the picker entirely and
                  let Department reclaim the slot (col-3 → col-6). The
                  underlying `postTypeId` value still flows through the
                  form via the prefill effect; only the UI is hidden. */}
                  {!(
                    (mode === "create" && !!prefillPostTypeSlug) ||
                    mode === "edit"
                  ) && (
                    <div className="lg:col-span-3">
                      <FormField
                        control={form.control}
                        name="postTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Post as{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={(v) => field.onChange(v)}
                              disabled={postTypes.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={
                                      postTypes.length === 0
                                        ? "Loading…"
                                        : "Pick a type"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {postTypes.map((pt) => (
                                  <SelectItem key={pt.id} value={pt.id}>
                                    {pt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div
                    className={
                      (mode === "create" && !!prefillPostTypeSlug) ||
                      mode === "edit"
                        ? "lg:col-span-6"
                        : "lg:col-span-3"
                    }
                  >
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Department
                            {selectedPostTypeSlug === "lesson" && (
                              <span className="text-destructive">*</span>
                            )}
                          </FormLabel>

                          {/* Org-level toggle — only shown to systemAdmin /
                          organizationAdmin AND only when the post type
                          isn't `lesson` (lessons must always belong to
                          a department). When ON, the picker is hidden
                          and `departmentId` is sent as undefined. */}
                          {canPublishOrgLevel &&
                            selectedPostTypeSlug !== "lesson" && (
                              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium">
                                    Organization-level (no department)
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    Author site-wide content not owned by a
                                    department.
                                  </span>
                                </div>
                                <Switch
                                  checked={isOrgLevel}
                                  onCheckedChange={setIsOrgLevel}
                                />
                              </div>
                            )}

                          {/* Picker is always mounted (so the
                          permissions fetch fires once) but visually
                          hidden when org-level mode is active. This
                          keeps the toggle visible when editing an
                          existing departmentless post. */}
                          <div className={isOrgLevel ? "hidden" : ""}>
                            <FormControl>
                              <DepartmentPicker
                                value={field.value ?? undefined}
                                onChange={field.onChange}
                                onLoaded={(items) =>
                                  setHasPublishableDepartments(items.length > 0)
                                }
                                onCanPublishOrgLevel={setCanPublishOrgLevel}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={
                      watchedStatus === "Scheduled"
                        ? "lg:col-span-3"
                        : "lg:col-span-6"
                    }
                  >
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel className="text-sm">Status</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Draft">
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                                    Draft
                                  </span>
                                </SelectItem>
                                <SelectItem value="Published">
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Published
                                  </span>
                                </SelectItem>
                                <SelectItem value="Scheduled">
                                  <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    Scheduled
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  {watchedStatus === "Scheduled" && (
                    <div className="lg:col-span-3">
                      <FormField
                        control={form.control}
                        name="scheduledAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5 text-sm">
                              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              Publish at{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                value={toDatetimeLocal(field.value)}
                                onChange={(e) =>
                                  field.onChange(
                                    fromDatetimeLocal(e.target.value),
                                  )
                                }
                              />
                            </FormControl>
                            {watchedScheduledAt &&
                              new Date(watchedScheduledAt).getTime() <=
                                Date.now() && (
                                <p className="text-xs text-destructive">
                                  Must be in the future.
                                </p>
                              )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </details>,
          )}

          {/* ───────── Lesson audience — only when PostType slug is 'lesson'.
              Cascades Subject (filtered by Department) → Batches teaching
              that subject. Empty `batchIds` means "every batch teaching the
              subject, now and in the future". Sits in slot 2 so the lesson
              cascade is right next to the Department picker that drives it. */}
          {selectedPostTypeSlug === "page" &&
            sidebarPortal(
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">Page settings</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2 [&_.grid]:!grid-cols-1">
                  <PageSettingsForm
                    form={form}
                    editingPostId={initialData?._id}
                  />
                </div>
              </details>,
            )}

          {/* Template picker for non-page post types. Pages use the
              richer apply-on-select picker inside `PageSettingsForm`
              (it copies the template's layout into `page.layout` so
              the author can tweak per-page). Other post types only
              need a reference: the public renderer resolves the
              template at request time and slots `post.body` into any
              `postBody` section the template carries. */}
          {selectedPostTypeSlug &&
            selectedPostTypeSlug !== "page" &&
            sidebarPortal(
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">Template</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <TemplatePicker form={form} />
                </div>
              </details>,
            )}

          {selectedPostTypeSlug === "lesson" &&
            sidebarPortal(
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">
                    Lesson audience &amp; sequencing
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2">
                  <FormField
                    control={form.control}
                    name="lessonContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LessonAudienceSelector
                            departmentId={watch("departmentId") ?? undefined}
                            lessonPostTypeId={lessonPostTypeId}
                            editingPostId={initialData?._id}
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>,
            )}

          {/* ───────── Event details — only when PostType slug is 'events'.
              Drives the calendar view + upcoming-event reminders. Privacy
              rides on the existing visibility field (Public for university-
              wide; Protected + allowedGroups for group-scoped). */}
          {selectedPostTypeSlug === "events" && (
            <SectionShell
              title="Event details"
              description="Calendar listing + upcoming-event reminders use these fields."
              className={mainCol(3)}
            >
              <FormField
                control={form.control}
                name="eventContext"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <EventDetailsCard
                        value={field.value as any}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionShell>
          )}

          {/* ───────── Announcement details — only when PostType slug is
              'announcements'. Promotes priority/pin/expiry/ack/channels +
              batch narrowing to first-class so the announcement feed UI
              can render them consistently. Audience scope rides on the
              existing visibility + allowedGroups; targetBatchIds is an
              additional intersect-narrow on top of that. */}
          {selectedPostTypeSlug === "announcements" &&
            sidebarPortal(
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">
                    Announcement details
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2 [&_.grid]:!grid-cols-1">
                  <FormField
                    control={form.control}
                    name="announcementContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <AnnouncementDetailsCard
                            departmentId={watch("departmentId") ?? undefined}
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </details>,
            )}

          {/* ───────── Page body — only when PostType slug is 'page'.
              Renders `unwrapped` so the body editor + collapsible page
              settings flow directly into the form (no nested Card
              outline). Sectional spacing — `border-t pt-8 mt-8` — gives
              the same visual break between Excerpt above and the body
              that other postTypes get from `SectionShell`. */}
          {selectedPostTypeSlug === "page" && (
            <div className={`${mainCol(2)} pt-8 mt-8`}>
              <PageDetailsCard
                form={form}
                editingPostId={initialData?._id}
                langTab={langTab}
                setLangTab={setLangTab}
                unwrapped
              />
            </div>
          )}

          {/* ───────── Audience & Categorization — collapsible, stacked ─────────
              Same `<details>` treatment as Publishing / SEO /
              Engagement: closed-by-default summary with title +
              chevron; expanded body lists Visibility / Categories /
              Tags / Allowed Groups stacked single-column. */}
          {sidebarPortal(
            <details name="settingsAccordion" className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                <span className="font-semibold text-sm">
                  Audience &amp; Categorization
                </span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-4">
                <p className="text-[11px] text-muted-foreground">
                  {watchedVisibility === "Public" &&
                    "Anyone on the public site can read this post."}
                  {watchedVisibility === "Private" &&
                    "Only the roles / users / groups you allow."}
                  {watchedVisibility === "Protected" &&
                    "Hidden from listings; reachable only via a direct link to allowed users."}
                  {watchedVisibility === "Password" &&
                    "Readers must enter the password below to view."}
                  {watchedVisibility === "Restricted" &&
                    "Locked to the lesson audience (subject + batch enrollment). Auto-set for Lesson posts."}
                </p>
                <div className="space-y-4">
                  <div
                    className={
                      watchedVisibility === "Password"
                        ? "lg:col-span-3"
                        : "lg:col-span-6"
                    }
                  >
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => {
                        if (field.value === "Restricted") {
                          // Lesson PostType: visibility is auto-managed; show a
                          // locked indicator instead of the picker so the author
                          // can't pick Public/Private for a lesson.
                          return (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Visibility
                              </FormLabel>
                              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/40 text-sm">
                                <Lock className="h-3.5 w-3.5 text-amber-600" />
                                <span className="font-medium">Restricted</span>
                                <span className="text-[11px] text-muted-foreground ml-auto">
                                  Locked to lesson audience
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          );
                        }
                        return (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Visibility
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Public">
                                  <span className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                                    Public
                                  </span>
                                </SelectItem>
                                <SelectItem value="Private">
                                  <span className="flex items-center gap-2">
                                    <Lock className="h-3.5 w-3.5 text-rose-600" />
                                    Private
                                  </span>
                                </SelectItem>
                                <SelectItem value="Protected">
                                  <span className="flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                                    Protected
                                  </span>
                                </SelectItem>
                                <SelectItem value="Password">
                                  <span className="flex items-center gap-2">
                                    <KeyRound className="h-3.5 w-3.5 text-violet-600" />
                                    Password
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  {watchedVisibility === "Password" && (
                    <div className="lg:col-span-3">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5 text-sm">
                              <KeyRound className="h-3.5 w-3.5 text-violet-600" />
                              Password{" "}
                              {mode === "create" && (
                                <span className="text-destructive">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                autoComplete="new-password"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value || undefined)
                                }
                                placeholder={
                                  mode === "edit"
                                    ? "Leave blank to keep"
                                    : "Reader password"
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="lg:col-span-3">
                    <FormField
                      control={form.control}
                      name="categoryIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm">
                            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                            Categories
                          </FormLabel>
                          <FormControl>
                            <CategoryPicker
                              value={(field.value as string[]) || []}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <FormField
                      control={form.control}
                      name="tagIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5 text-sm">
                            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                            Tags
                          </FormLabel>
                          <FormControl>
                            <TagPicker
                              value={(field.value as string[]) || []}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Access control — only when visibility is Private or Protected.
                Lives inside Card 2 because it belongs to "Audience". */}
                {(watchedVisibility === "Private" ||
                  watchedVisibility === "Protected") && (
                  <div className="space-y-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Choose who can view this post. Anyone matching ANY of the
                      three lists below is granted access.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <AccessControlPicker
                        label="Allowed Roles"
                        endpoint="/core/roles/ref"
                        value={
                          (watch("allowedRoles") as string[] | undefined) ?? []
                        }
                        onChange={(ids) => setValue("allowedRoles", ids)}
                        placeholder="Search roles…"
                      />
                      <AccessControlPicker
                        label="Allowed Users"
                        endpoint="/core/users/ref"
                        value={
                          (watch("allowedUsers") as string[] | undefined) ?? []
                        }
                        onChange={(ids) => setValue("allowedUsers", ids)}
                        placeholder="Search users…"
                      />
                      <AccessControlPicker
                        label="Allowed Groups"
                        endpoint="/core/groups/ref"
                        value={
                          (watch("allowedGroups") as string[] | undefined) ?? []
                        }
                        onChange={(ids) => setValue("allowedGroups", ids)}
                        placeholder="Search groups…"
                      />
                    </div>
                  </div>
                )}
              </div>
            </details>,
          )}

          {/* ───────── CARD 3 — Title / Slug / Excerpt / Featured Image
              Two-column layout: text fields (col-8) + featured image (col-4).
              Promoted to the top via `order-1` for page postType so authors
              land on Title first instead of having to scroll past Publishing
              and Page settings.

              For page postType the surrounding Card chrome (border /
              shadow / padding) is suppressed via Tailwind `!` overrides
              so Title / Excerpt / Slug / Page body sit directly in the
              form flow — there's already a strong visual anchor (the
              big H1 title row), so the extra card outline just adds
              noise. */}
          <Card
            className={`${mainCol(1)} ${
              isPageMode
                ? '!border-0 !shadow-none !bg-transparent !py-0 !gap-3'
                : ''
            }`}
          >
            <CardContent className={isPageMode ? '!px-0 !pb-0' : ''}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ───────── LEFT (col-8) — Title / Slug / Excerpt ───────── */}
                <div className={`${isPageMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-5`}>
                  {/* ───────── TITLE — EN + MM side by side (col-6 each) ───────── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        Title <span className="text-destructive">*</span>
                      </FormLabel>
                      {/* "Auto slug" toggle — when on, slug is derived
                          from title.en; when off, the manual slug input
                          below the Excerpt is exposed. */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="autoSlug"
                          checked={autoSlug}
                          onCheckedChange={(checked) =>
                            setAutoSlug(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="autoSlug"
                          className="text-xs text-muted-foreground select-none cursor-pointer"
                        >
                          Auto slug
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="title.en"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Post title in English"
                                className="text-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title.mm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ပို့စ် ခေါင်းစဉ် (မြန်မာ)"
                                className="text-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* ───────── EXCERPT — EN + MM side by side (col-6 each) ───────── */}
                  <div className="space-y-2">
                    <FormLabel>Excerpt</FormLabel>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="excerpt.en"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Brief summary in English..."
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="excerpt.mm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="အကျဉ်းချုပ် (မြန်မာ)..."
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* ───────── SLUG — manual mode only.
              Hidden when "Auto slug" toggle in the title row is on (default).
              No leading "/" — just the bare slug input. */}
                  {!autoSlug && (
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="post-slug"
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          {watchedSlug && watchedSlug.length >= 2 && (
                            <p
                              className={`text-xs ${
                                slugStatus === "taken"
                                  ? "text-destructive"
                                  : slugStatus === "available"
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {slugStatus === "checking" && "Checking…"}
                              {slugStatus === "available" &&
                                "✓ Slug is available"}
                              {slugStatus === "taken" &&
                                "✗ This slug is already in use — choose another"}
                              {slugStatus === "error" &&
                                "Could not verify slug uniqueness"}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* ───────── RIGHT (col-4) — Featured Image ─────────
                  Hidden for page postType — Featured Image is rendered
                  in the settings sidebar instead so the page editor's
                  main canvas stays focused on Title + Body. The inline
                  render here remains for article / lesson / news / etc. */}
                {!isPageMode && (
                  <div className="lg:col-span-4">{featuredImageField}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ───────── CARD 4 — Content Type & Body ─────────
              Hidden for `page` posts: pages route their body through
              PageDetailsCard (`bodyTiptap` or `sectionRefs`) and don't
              consume the generic `body` / `contentType` channel. Showing
              both editors confuses authors and persists into both
              fields, which the page renderer ignores anyway. */}
          {selectedPostTypeSlug !== "page" && (
            <SectionShell
              title="Body"
              description="Pick a content type and fill in the matching editor."
              className={`${mainCol(2)} !border-t-0`}
            >
              <div className="space-y-5">
                {/* ───────── ROW 6 — Content Type Selector ─────────
              Switching here changes which widget shows in Row 7. Other
              blocks stay in form state so flipping back-and-forth doesn't
              lose typed content. */}
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Content type <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <ContentTypeSelector
                          value={(field.value ?? "article") as any}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        The public site renders different layouts per type.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ───────── ROW 7 — Content (one widget per `contentType`) ───────── */}
                {/* Article — Tiptap multilingual body (default) */}
                {watchedContentType === "article" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        Content <span className="text-destructive">*</span>
                      </FormLabel>
                      {/* Reading time + word count badges (Phase C-5) */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted px-2 py-0.5 tabular-nums">
                          {wordCount} words
                        </span>
                        <span className="rounded-md bg-muted px-2 py-0.5 tabular-nums">
                          {readingMinutes} min read
                        </span>
                      </div>
                    </div>
                    <Tabs
                      value={langTab}
                      onValueChange={(v) => setLangTab(v as "en" | "mm")}
                    >
                      <TabsList className="h-8 mb-2">
                        <TabsTrigger value="en" className="text-xs px-2 py-1">
                          EN
                        </TabsTrigger>
                        <TabsTrigger value="mm" className="text-xs px-2 py-1">
                          MM
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="en" className="mt-0">
                        <FormField
                          control={form.control}
                          name="body.en"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TiptapEditor
                                  content={field.value}
                                  onChange={field.onChange}
                                  outputFormat="json"
                                  placeholder="Write your content in English..."
                                  minHeight="300px"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      <TabsContent value="mm" className="mt-0">
                        <FormField
                          control={form.control}
                          name="body.mm"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <TiptapEditor
                                  content={field.value}
                                  onChange={field.onChange}
                                  outputFormat="json"
                                  placeholder="အကြောင်းအရာ ရေးပါ (မြန်မာ)..."
                                  minHeight="300px"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* PDF block — multi-PDF picker */}
                {watchedContentType === "pdf" && (
                  <FormField
                    control={form.control}
                    name="pdfBlock"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PdfBlockField
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Table block — columns + rows + import + settings */}
                {watchedContentType === "table" && (
                  <FormField
                    control={form.control}
                    name="tableBlock"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TableBlockField
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Video block — uploaded clips + external embeds */}
                {watchedContentType === "video" && (
                  <FormField
                    control={form.control}
                    name="videoBlock"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <VideoBlockField
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Slides block — paired PDF preview + PPTX download.
                Author uploads BOTH; viewer renders PDF inline and offers
                the PPTX as a download. No server-side conversion. */}
                {watchedContentType === "slides" && (
                  <FormField
                    control={form.control}
                    name="slidesBlock"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SlidesBlockField
                            value={field.value as any}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Gallery — note: existing galleryImages field below acts as the
                primary content when contentType === 'gallery'. */}
                {watchedContentType === "gallery" && (
                  <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    Add and arrange your images in the <strong>Gallery</strong>{" "}
                    section below. The public site renders them as a grid with
                    lightbox preview.
                  </p>
                )}

                {/* (Featured Image lives in Row 5.5 above; duplicate removed.) */}

                {/* Gallery — primary content when contentType === 'gallery'.
                Hidden for other types since the post is one-of-N format. */}
                {watchedContentType === "gallery" && (
                  <FormField
                    control={form.control}
                    name="galleryImages"
                    render={({ field }) => {
                      const items = (field.value ?? []) as Array<{
                        mediaId?: string;
                        url: string;
                        alt?: { en?: string; mm?: string };
                        caption?: { en?: string; mm?: string };
                      }>;

                      const updateAt = (
                        idx: number,
                        patch: Partial<(typeof items)[0]>,
                      ) => {
                        const next = items.slice();
                        next[idx] = { ...next[idx], ...patch };
                        field.onChange(next);
                      };
                      const removeAt = (idx: number) => {
                        field.onChange(items.filter((_, i) => i !== idx));
                      };
                      const move = (idx: number, dir: -1 | 1) => {
                        const target = idx + dir;
                        if (target < 0 || target >= items.length) return;
                        const next = items.slice();
                        [next[idx], next[target]] = [next[target], next[idx]];
                        field.onChange(next);
                      };
                      const addMany = (media: MediaFile[]) => {
                        const additions = media.map((m) => ({
                          mediaId: m.id,
                          url: m.url,
                          alt: m.alt,
                          caption: m.caption,
                        }));
                        field.onChange([...items, ...additions]);
                      };

                      return (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Gallery</FormLabel>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {items.length} image
                              {items.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {items.length > 0 && (
                            <div className="space-y-2">
                              {items.map((img, idx) => (
                                <div
                                  key={`${img.mediaId ?? img.url}-${idx}`}
                                  className="flex items-center gap-2 rounded-md border bg-background p-2"
                                >
                                  <img
                                    src={img.url}
                                    alt={img.alt?.en ?? ""}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                  />
                                  <Input
                                    value={img.alt?.en ?? ""}
                                    onChange={(e) =>
                                      updateAt(idx, {
                                        alt: { ...img.alt, en: e.target.value },
                                      })
                                    }
                                    placeholder="Alt text (EN)"
                                    className="text-xs h-8"
                                  />
                                  <Input
                                    value={img.alt?.mm ?? ""}
                                    onChange={(e) =>
                                      updateAt(idx, {
                                        alt: { ...img.alt, mm: e.target.value },
                                      })
                                    }
                                    placeholder="အစားထိုးစာသား (MM)"
                                    className="text-xs h-8"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => move(idx, -1)}
                                      disabled={idx === 0}
                                      className="h-4 px-1 text-[10px]"
                                      title="Move up"
                                    >
                                      ▲
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => move(idx, 1)}
                                      disabled={idx === items.length - 1}
                                      className="h-4 px-1 text-[10px]"
                                      title="Move down"
                                    >
                                      ▼
                                    </Button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAt(idx)}
                                    title="Remove from gallery"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-1">
                            <MediaBrowserButton
                              label={
                                items.length === 0
                                  ? "Add images to gallery"
                                  : "Add more images"
                              }
                              variant="outline"
                              size="sm"
                              config={{
                                allowedTypes: ["image/*"],
                                selectionMode: "multiple",
                              }}
                              onSelectMedia={addMany}
                            />
                          </div>
                          <FormDescription className="text-xs">
                            Optional — additional photos beyond the featured
                            image. Order is preserved.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                {/* (Category + Tags moved to Row 2 above; duplicates removed.) */}
              </div>
            </SectionShell>
          )}

          {/* ───────── CARD 5 — SEO & Search (full width; meta | social) ─────────
              Collapsible for page postType — reduces visual weight on the
              page editor where SEO is rarely the main focus. Other post
              types keep the always-open Card layout. */}
          {(() => {
            const seoBody = (
              <SeoEditor
                metaTitle={watchedMetaTitle}
                metaDescription={watchedMetaDescription}
                metaKeywords={watchedMetaKeywords}
                ogImage={watchedOgImage}
                featuredImage={watchedFeaturedImage}
                canonicalUrl={watchedCanonicalUrl}
                fallbackTitleEn={watchedTitleEn}
                fallbackExcerptEn={watchedExcerptEn}
                fallbackBodyText={bodyText}
                postSlug={watchedSlug}
                onChange={(next) => {
                  setValue("metaTitle", next.metaTitle);
                  setValue("metaDescription", next.metaDescription);
                  setValue("metaKeywords", next.metaKeywords);
                  setValue("ogImage", next.ogImage);
                  setValue("canonicalUrl", next.canonicalUrl);
                }}
              />
            );
            const cardJsx = (
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">SEO &amp; Search</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2 [&_.grid]:!grid-cols-1">
                  {seoBody}
                </div>
              </details>
            );
            return sidebarPortal(cardJsx);
          })()}

          {/* ───────── CARD 6 — Engagement: Related │ Revisions │ Toggles ─────────
              Same collapsible treatment as SEO for page postType — see
              comment on Card 5 above. */}
          {(() => {
            const engagementBody = (
              <div className="space-y-5">
                <RelatedPostsPicker
                  postId={initialData?._id}
                  value={
                    (watch("relatedPostIds") as string[] | undefined) ?? []
                  }
                  onChange={(ids) => setValue("relatedPostIds", ids)}
                />

                <RevisionsPanel
                  postId={initialData?._id}
                  onRestored={() => onSuccess?.(form.getValues() as any)}
                />

                <div className="flex flex-wrap items-center gap-6 pt-3 border-t">
                  <FormField
                    control={form.control}
                    name="allowComments"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Allow Comments
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Featured Post
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            );
            const cardJsx = (
              <details name="settingsAccordion" className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden hover:bg-muted/40">
                  <span className="font-semibold text-sm">Engagement</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="px-4 pb-4 pt-2">{engagementBody}</div>
              </details>
            );
            return sidebarPortal(cardJsx);
          })()}

          {/* ───────── Custom fields — driven by the chosen PostType's
              attributes. Sits at the bottom so the post-author finishes the
              standard publishing flow before filling type-specific fields.
              Only renders when the chosen PostType actually defines any. */}
          {(loadingPostTypeAttrs || postTypeAttributes.length > 0) && (
            <SectionShell
              title={
                <span className="inline-flex items-center gap-2">
                  Custom fields
                  {loadingPostTypeAttrs && (
                    <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                      Loading…
                    </span>
                  )}
                </span>
              }
              description="Type-specific attributes defined on the PostType schema."
              className={mainCol(4)}
            >
                <FormField
                  control={form.control}
                  name="customFields"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CustomFieldsEditor
                          attributes={postTypeAttributes}
                          value={(field.value as any) || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </SectionShell>
          )}
        </fieldset>

        {/* Autosave indicator (E-6) — only meaningful in edit mode +
             Draft. Sits at the bottom of the form as plain text — no
             border / no Cancel button (Back in the header handles
             leaving the form). */}
        <div
          className={`text-xs ${
            autosaveStatus.state === "error"
              ? "text-destructive"
              : autosaveStatus.state === "saving" ||
                  autosaveStatus.state === "pending"
                ? "text-muted-foreground"
                : "text-green-600"
          }`}
        >
          {formatAutosaveStatus(autosaveStatus)}
        </div>
      </form>
    </Form>
  );
}

export default PostForm;
