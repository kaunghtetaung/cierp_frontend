"use client";

import React, { useState, useRef, useCallback } from "react";
import { useForm, FieldValues, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useQueryClient,
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { toastSuccess, toastError, getLocalizedText } from "@repo/utils";
import { Button } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { FormFieldRenderer } from "@repo/schema-forms";
import { generateZodSchema } from "@repo/schema-utils";
import { submitModuleForm } from "@repo/app-modules/server-actions";
import { moduleKeys } from "@repo/schema-hooks";

// Inline error messages to avoid import resolution issues
const errorMessages = {
  FORM_SUBMISSION_FAILED: {
    en: "Form submission failed. Please check the form and try again.",
    mm: "ဖောင်တင်ပြမှု မအောင်မြင်ပါ။ ဖောင်ကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။",
  },
};

function getLocalizedErrorMessage(
  key: keyof typeof errorMessages,
  lang: "en" | "mm"
): string {
  return (
    errorMessages[key]?.[lang] || errorMessages[key]?.en || "An error occurred"
  );
}
import { useLanguage } from "@repo/language";
import type { ModuleSchema, FormField } from "@repo/types";
import { ISBNScanner } from "./ISBNScanner";
import type { BookSearchResult } from "../google-books-actions";
import {
  findOrCreateRefDataAction,
  batchFindOrCreateRefDataAction,
} from "../google-books-actions";

interface BibliographyFormProps {
  module: ModuleSchema;
  action: "create" | "update";
  initialData?: Record<string, any>;
  moduleSlug: string;
  itemId?: string;
  appId?: string;
  tenantId: string;
  username?: string;
}

/**
 * Custom Bibliography Form Component
 *
 * Features:
 * - ISBN barcode scanner with Google Books API integration
 * - Auto-fill form fields from Google Books data
 * - Auto-download and upload book cover images
 * - Full FormWithLanguage compatibility (uses same formField schema)
 */
function BibliographyFormInner({
  module,
  action,
  initialData,
  moduleSlug,
  itemId,
  appId = "core",
  tenantId,
  username,
}: BibliographyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "form">("scanner");

  // Filter form fields (exclude hidden and password in update mode)
  const filteredFormFields = module.formFields.filter((field) => {
    if (field.hidden) return false;
    if (action === "update" && field.fieldType === "password") return false;
    return true;
  });

  // Generate Zod schema for validation
  const validationSchema = generateZodSchema(filteredFormFields);

  // Initialize React Hook Form with default values
  // Default: catalogType = "68d14ff5125447a7a4f78368" (Book), mediaType = "book"
  const form = useForm<FieldValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      catalogType: "68d14ff5125447a7a4f78368", // Default to Book
      mediaType: "book", // Default to book
      ...initialData,
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    getValues,
  } = form;

  // Labels based on language
  const labels = {
    scannerTab: currentLanguage === "mm" ? "ISBN ရှာဖွေရန်" : "ISBN Lookup",
    formTab: currentLanguage === "mm" ? "ဖောင်" : "Form",
    title:
      currentLanguage === "mm" ? "စာအုပ်အသစ် ထည့်သွင်းရန်" : "Add New Book",
    description:
      currentLanguage === "mm"
        ? "ISBN ဖြင့် စာအုပ်ရှာဖွေပြီး အချက်အလက်များ အလိုအလျောက်ဖြည့်ပါ"
        : "Search by ISBN to auto-fill book information",
    saving: currentLanguage === "mm" ? "သိမ်းဆည်းနေသည်..." : "Saving...",
    create: currentLanguage === "mm" ? "ဖန်တီးမည်" : "Create",
    cancel: currentLanguage === "mm" ? "မလုပ်တော့ပါ" : "Cancel",
    reset: currentLanguage === "mm" ? "ပြန်လည်သတ်မှတ်" : "Reset",
    dataApplied:
      currentLanguage === "mm"
        ? "စာအုပ်အချက်အလက်များ ဖြည့်သွင်းပြီးပါပြီ"
        : "Book data applied to form",
    coverApplied:
      currentLanguage === "mm"
        ? "မျက်နှာဖုံးပုံ ထည့်သွင်းပြီးပါပြီ"
        : "Book cover applied",
  };

  // State for tracking unmatched reference data
  const [unmatchedRefData, setUnmatchedRefData] = useState<{
    authors?: string[];
    publisher?: string;
    subjects?: string[];
    language?: string;
  }>({});

  // Handle book data from ISBN scanner
  const handleBookFound = useCallback(
    async (bookData: NonNullable<BookSearchResult["data"]>) => {
      console.log("Book data received:", bookData);

      const unmatched: typeof unmatchedRefData = {};

      // Map Google Books data to form fields
      // Title - check if it's multilingual field
      if (bookData.title) {
        const titleField = filteredFormFields.find(
          (f) => f.fieldName === "title"
        );
        if (titleField?.isMultiLang) {
          // Set as multilingual object
          setValue(
            "title",
            { en: bookData.title, mm: bookData.title },
            { shouldDirty: true }
          );
        } else {
          setValue("title", bookData.title, { shouldDirty: true });
        }
      }

      // ISBN
      if (bookData.isbn13 || bookData.isbn10) {
        setValue("isbn", bookData.isbn13 || bookData.isbn10, {
          shouldDirty: true,
        });
      }

      // Year
      if (bookData.year) {
        setValue("year", bookData.year, { shouldDirty: true });
      }

      // Physical Description (page count : dimensions)
      // Format: "320 pages : 2 cm, 24 cm, 16 cm" (thickness, height, width)
      if (bookData.pageCount || bookData.dimensions) {
        const parts: string[] = [];

        // Add page count
        if (bookData.pageCount) {
          parts.push(`${bookData.pageCount} pages`);
        }

        // Add dimensions if available (thickness, height, width)
        if (bookData.dimensions) {
          const dimParts: string[] = [];
          if (bookData.dimensions.thickness) {
            dimParts.push(bookData.dimensions.thickness);
          }
          if (bookData.dimensions.height) {
            dimParts.push(bookData.dimensions.height);
          }
          if (bookData.dimensions.width) {
            dimParts.push(bookData.dimensions.width);
          }
          if (dimParts.length > 0) {
            parts.push(dimParts.join(", "));
          }
        }

        // Join with " : " separator
        const physicalDesc = parts.join(" : ");
        if (physicalDesc) {
          setValue("physicalDescription", physicalDesc, { shouldDirty: true });
        }
      }

      // Note/Description
      if (bookData.description) {
        // Truncate if too long
        const truncatedDesc =
          bookData.description.length > 1000
            ? bookData.description.substring(0, 997) + "..."
            : bookData.description;
        setValue("note", truncatedDesc, { shouldDirty: true });
      }

      // Note: catalogType defaults to "Book" in the form schema, no need to set it here
      // mediaType will also use form defaults

      // Helper function to cache label for TypeaheadDynamicSelect display
      // TypeaheadDynamicSelect uses localStorage with key: typeahead_label_${fieldName}_${id}
      const cacheLabel = (fieldName: string, id: string, label: string) => {
        if (typeof window !== "undefined" && id && label) {
          const cacheKey = `typeahead_label_${fieldName}_${id}`;
          localStorage.setItem(cacheKey, label);
          console.log(`[BOOK_DATA] Cached label: ${cacheKey} = ${label}`);
        }
      };

      // Handle Author (primary author - first in the list)
      if (bookData.authors && bookData.authors.length > 0) {
        const primaryAuthor = bookData.authors[0];
        console.log(`[BOOK_DATA] Searching for author: ${primaryAuthor}`);

        const authorResult = await findOrCreateRefDataAction({
          module: "authors",
          searchName: primaryAuthor,
          createIfNotFound: true, // Auto-create if not found
        });

        if (authorResult.success && authorResult.data) {
          const authorId = authorResult.data.id || authorResult.data._id || "";
          const authorName =
            authorResult.data.name ||
            authorResult.data.fullName ||
            primaryAuthor;
          setValue("author", authorId, { shouldDirty: true });
          // Cache the label so TypeaheadDynamicSelect can display it
          cacheLabel("author", authorId, authorName);
          if (authorResult.created) {
            console.log(`[BOOK_DATA] Created new author: ${primaryAuthor}`);
          }
        } else {
          unmatched.authors = [primaryAuthor];
        }

        // Handle additional authors (rest of the list)
        if (bookData.authors.length > 1) {
          const additionalAuthors = bookData.authors.slice(1);
          const additionalResult = await batchFindOrCreateRefDataAction({
            module: "authors",
            names: additionalAuthors,
            createIfNotFound: true,
          });

          if (
            additionalResult.success &&
            additionalResult.data &&
            additionalResult.data.length > 0
          ) {
            const additionalAuthorIds = additionalResult.data.map((a) => a.id);
            setValue("additionalAuthors", additionalAuthorIds, {
              shouldDirty: true,
            });
            // Cache labels for each additional author
            additionalResult.data.forEach((author) => {
              cacheLabel("additionalAuthors", author.id, author.name);
            });
          }

          if (
            additionalResult.notFound &&
            additionalResult.notFound.length > 0
          ) {
            unmatched.authors = [
              ...(unmatched.authors || []),
              ...additionalResult.notFound,
            ];
          }
        }
      }

      // Handle Publisher
      if (bookData.publisher) {
        console.log(
          `[BOOK_DATA] Searching for publisher: ${bookData.publisher}`
        );

        const publisherResult = await findOrCreateRefDataAction({
          module: "publishers",
          searchName: bookData.publisher,
          createIfNotFound: true, // Auto-create if not found
        });

        if (publisherResult.success && publisherResult.data) {
          const publisherId =
            publisherResult.data.id || publisherResult.data._id || "";
          const publisherName = publisherResult.data.name || bookData.publisher;
          setValue("publisher", publisherId, { shouldDirty: true });
          // Cache the label so TypeaheadDynamicSelect can display it
          cacheLabel("publisher", publisherId, publisherName);
          if (publisherResult.created) {
            console.log(
              `[BOOK_DATA] Created new publisher: ${bookData.publisher}`
            );
          }
        } else {
          unmatched.publisher = bookData.publisher;
        }
      }

      // Handle Subjects/Categories
      if (bookData.categories && bookData.categories.length > 0) {
        console.log(
          `[BOOK_DATA] Searching for subjects: ${bookData.categories.join(
            ", "
          )}`
        );

        const subjectsResult = await batchFindOrCreateRefDataAction({
          module: "subjects",
          names: bookData.categories,
          createIfNotFound: true, // Auto-create if not found
        });

        if (
          subjectsResult.success &&
          subjectsResult.data &&
          subjectsResult.data.length > 0
        ) {
          const subjectIds = subjectsResult.data.map((s) => s.id);
          setValue("subjects", subjectIds, { shouldDirty: true });
          // Cache labels for each subject
          subjectsResult.data.forEach((subject) => {
            cacheLabel("subjects", subject.id, subject.name);
          });
        }

        if (subjectsResult.notFound && subjectsResult.notFound.length > 0) {
          unmatched.subjects = subjectsResult.notFound;
        }
      }

      // Handle Language
      // Google Books returns language code like "en", "de", "fr", etc.
      if (bookData.language) {
        console.log(`[BOOK_DATA] Searching for language: ${bookData.language}`);

        // Map common language codes to full names for better search
        const languageNames: Record<string, string> = {
          en: "English",
          de: "German",
          fr: "French",
          es: "Spanish",
          it: "Italian",
          pt: "Portuguese",
          ru: "Russian",
          zh: "Chinese",
          ja: "Japanese",
          ko: "Korean",
          ar: "Arabic",
          hi: "Hindi",
          my: "Myanmar",
          mm: "Myanmar",
        };

        const languageSearch =
          languageNames[bookData.language.toLowerCase()] || bookData.language;

        const languageResult = await findOrCreateRefDataAction({
          module: "languages",
          searchName: languageSearch,
          createIfNotFound: false, // Don't auto-create languages, just search
        });

        if (languageResult.success && languageResult.data) {
          const languageId =
            languageResult.data.id || languageResult.data._id || "";
          const languageName = languageResult.data.name || languageSearch;
          setValue("language", languageId, { shouldDirty: true });
          // Cache the label so TypeaheadDynamicSelect can display it
          cacheLabel("language", languageId, languageName);
          console.log(`[BOOK_DATA] Set language: ${languageName}`);
        }
      }

      // Update unmatched state for UI feedback
      setUnmatchedRefData(unmatched);

      // Show success toast
      toastSuccess(labels.dataApplied);

      // Switch to form tab to show the filled data
      setActiveTab("form");
    },
    [setValue, filteredFormFields, labels.dataApplied]
  );

  // Handle book cover upload from ISBN scanner
  const handleCoverUploaded = useCallback(
    (coverData: { key: string; url: string; name: string }) => {
      console.log("Cover data received:", coverData);

      // Set the book cover image field
      // The MediaBrowserField expects a URL in 'url' returnFormat
      setValue("bookCoverImage", coverData.url, { shouldDirty: true });

      toastSuccess(labels.coverApplied);
    },
    [setValue, labels.coverApplied]
  );

  // Organize fields into specific rows for custom layout
  const fieldLayout = React.useMemo(() => {
    // Create a map for quick field lookup
    const fieldMap = new Map<string, FormField>();
    filteredFormFields.forEach((field) => {
      fieldMap.set(field.fieldName, field);
    });

    // Define the row layout
    // Row 1: Title (full width)
    // Row 2: catalogType, mediaType, isbn, issn (4 columns)
    // Row 3: author, additionalAuthors (2 columns)
    // Row 4: editors, publisher (2 columns)
    // Row 5: subjects, degrees (2 columns)
    // Remaining fields go to details/files/metadata sections

    const row1Fields = ["title"];
    const row2Fields = ["catalogType", "mediaType", "isbn", "issn"];
    const row3Fields = ["author", "publisher"]; // Row 3: author, publisher (2 columns)
    const row4Fields = ["editors"]; // Row 4: editors (full width)
    const row5Fields = ["additionalAuthors"]; // Row 5: additionalAuthors (full width)
    const row5aFields = ["subjects"]; // Row 5a: subjects (full width)
    const row5bFields = ["degrees"]; // Row 5b: degrees (full width)
    const row6Fields = ["language", "year", "callNo", "edition"]; // Details row 1: 4 columns
    const fileFields = [
      "bookCoverImage",
      "abstractFile",
      "contentsFile",
      "ebookFile",
    ];
    const metadataFields = ["createdAt", "updatedAt", "createdBy", "updatedBy"];

    // Collect fields for each row
    const getFields = (names: string[]): FormField[] => {
      return names
        .map((name) => fieldMap.get(name))
        .filter((f): f is FormField => !!f);
    };

    // Collect remaining fields (not in specific rows)
    const assignedFields = new Set([
      ...row1Fields,
      ...row2Fields,
      ...row3Fields,
      ...row4Fields,
      ...row5Fields,
      ...row5aFields,
      ...row5bFields,
      ...row6Fields,
      ...fileFields,
      ...metadataFields,
    ]);

    const detailFields: FormField[] = [];
    const files: FormField[] = [];
    const metadata: FormField[] = [];

    filteredFormFields.forEach((field) => {
      if (assignedFields.has(field.fieldName)) {
        if (fileFields.includes(field.fieldName)) {
          files.push(field);
        } else if (
          metadataFields.some((f) =>
            field.fieldName.toLowerCase().includes(f.toLowerCase())
          )
        ) {
          metadata.push(field);
        }
      } else {
        // Remaining fields go to details
        if (
          metadataFields.some((f) =>
            field.fieldName.toLowerCase().includes(f.toLowerCase())
          )
        ) {
          metadata.push(field);
        } else {
          detailFields.push(field);
        }
      }
    });

    return {
      row1: getFields(row1Fields),
      row2: getFields(row2Fields),
      row3: getFields(row3Fields),
      row4: getFields(row4Fields),
      row5: getFields(row5Fields),
      row5a: getFields(row5aFields),
      row5b: getFields(row5bFields),
      row6: getFields(row6Fields),
      details: detailFields,
      files: files,
      metadata: metadata,
    };
  }, [filteredFormFields]);

  const isVerticalLayout = module.formLayout === "vertical";

  const onSubmit = async (data: FieldValues) => {
    setSubmitError(null);
    setIsSubmittingForm(true);

    try {
      const formData = new FormData();

      // For update operations, include version
      if (action === "update" && initialData) {
        if (initialData.version !== undefined) {
          formData.append("version", String(initialData.version));
        }
      }

      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "object" && value.en !== undefined) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === "string" && value.startsWith('{"en":')) {
            formData.append(key, value);
          } else if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, String(item)));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const result = await submitModuleForm(
        moduleSlug,
        formData,
        action,
        itemId,
        true // skipRedirect
      );

      if (!result.success) {
        if (result.fieldErrors && result.fieldErrors.length > 0) {
          const fieldErrorsText = result.fieldErrors.join("\n");
          const mainError =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          const traceInfo = result.traceId
            ? `\n\nTrace ID: ${result.traceId}`
            : "";
          const errorMessage = `${mainError}\n\nField errors:\n${fieldErrorsText}${traceInfo}`;
          toastError(mainError);
          throw new Error(errorMessage);
        } else if (result.errors) {
          const errorMessages = Object.entries(result.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
          const toastErrorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(toastErrorMessage);
          throw new Error(errorMessages);
        } else {
          const errorMessage =
            result.error ||
            getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
          toastError(errorMessage);
          throw new Error(errorMessage);
        }
      }

      // Success
      console.log("Form submitted successfully");

      // Invalidate cache
      await queryClient.removeQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: [...moduleKeys.lists(), moduleSlug],
        exact: false,
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: ["modules"],
        exact: false,
        refetchType: "all",
      });

      // Success toast
      const successMessage =
        action === "create"
          ? currentLanguage === "mm"
            ? `${getLocalizedText(
                module.name,
                currentLanguage
              )} အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!`
            : `${getLocalizedText(
                module.name,
                currentLanguage
              )} created successfully!`
          : currentLanguage === "mm"
          ? `${getLocalizedText(
              module.name,
              currentLanguage
            )} အောင်မြင်စွာ အပ်ဒိတ်လုပ်ပြီးပါပြီ!`
          : `${getLocalizedText(
              module.name,
              currentLanguage
            )} updated successfully!`;

      toastSuccess(successMessage);

      // Redirect
      setTimeout(() => {
        const redirectPath = appId
          ? `/${appId}/${moduleSlug}`
          : `/${moduleSlug}`;
        const timestamp = Date.now();
        router.push(`${redirectPath}?_refresh=${timestamp}`);
      }, 1500);
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : getLocalizedErrorMessage(
              "FORM_SUBMISSION_FAILED",
              currentLanguage as "en" | "mm"
            );
      setSubmitError(errorMessage);
      toastError(errorMessage);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  // Render a single field with full width
  const renderField = (field: FormField) => (
    <div className="w-full [&>div]:w-full [&_input]:w-full [&_select]:w-full [&_button[role='combobox']]:w-full [&_.select-trigger]:w-full">
      <FormFieldRenderer
        field={field}
        currentLanguage={currentLanguage}
        isVerticalLayout={isVerticalLayout}
        errors={errors}
        watch={watch}
      />
    </div>
  );

  // Render a row of fields with specified grid columns
  const renderRow = (fields: FormField[], columns: number = 2) => {
    if (fields.length === 0) return null;

    const gridClass =
      columns === 4
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        : columns === 3
        ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
        : "grid grid-cols-1 md:grid-cols-2 gap-4";

    return (
      <div className={gridClass}>
        {fields.map((field) => (
          <div
            key={field.fieldName}
            className="animate-in slide-in-from-bottom-2"
          >
            {renderField(field)}
          </div>
        ))}
      </div>
    );
  };

  // Render field group with title (for details, files, metadata)
  const renderFieldGroup = (fields: FormField[], title: string) => {
    if (fields.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div
              key={field.fieldName}
              className={`${
                field.fieldType === "textArea" ||
                field.fieldType === "htmlContent"
                  ? "md:col-span-2"
                  : ""
              } animate-in slide-in-from-bottom-2`}
            >
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <Card className="mb-6 border-0 shadow-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl shadow-lg">
                <IconComponent
                  name={module.iconName || "BookOpen"}
                  className="w-8 h-8 text-primary"
                />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {labels.title}
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {labels.description}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "scanner" | "form")}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <IconComponent name="Scan" className="h-4 w-4" />
              {labels.scannerTab}
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <IconComponent name="FileText" className="h-4 w-4" />
              {labels.formTab}
              {isDirty && (
                <span className="ml-1 w-2 h-2 bg-warning rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <ISBNScanner
              onBookFound={handleBookFound}
              onCoverUploaded={handleCoverUploaded}
              tenantId={tenantId}
              appId={appId}
              currentLanguage={currentLanguage}
              disabled={isSubmittingForm}
            />

            {/* Quick preview of form data */}
            {isDirty && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="pt-4">
                  <p className="text-sm text-success">
                    <IconComponent
                      name="CheckCircle"
                      className="inline h-4 w-4 mr-2"
                    />
                    {currentLanguage === "mm"
                      ? "စာအုပ်အချက်အလက်များ ဖောင်တွင် ဖြည့်သွင်းပြီးပါပြီ။ 'ဖောင်' တက်ဘ်သို့ သွား၍ စစ်ဆေးပြီး သိမ်းဆည်းနိုင်ပါပြီ။"
                      : "Book data has been filled in the form. Go to the 'Form' tab to review and save."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form">
            <Card className="relative z-0 shadow-xl border-0">
              <CardContent className="p-0">
                <FormProvider {...form}>
                  <form onSubmit={handleSubmit(onSubmit)} className="relative">
                    <div className="relative z-0 p-6 space-y-6">
                      {/* Section 1: Basic Information */}
                      {fieldLayout.row1.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {currentLanguage === "mm"
                              ? "အခြေခံအချက်အလက်"
                              : "Basic Information"}
                          </h3>
                          {fieldLayout.row1.map((field) => (
                            <div
                              key={field.fieldName}
                              className="animate-in slide-in-from-bottom-2"
                            >
                              {renderField(field)}
                            </div>
                          ))}
                          {/* Row 2: catalogType, mediaType, isbn, issn (4 columns) */}
                          {renderRow(fieldLayout.row2, 4)}
                        </div>
                      )}

                      {/* Separator */}
                      <hr className="border-border/50" />

                      {/* Section 2: Contributors */}
                      {(fieldLayout.row3.length > 0 ||
                        fieldLayout.row4.length > 0 ||
                        fieldLayout.row5.length > 0) && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {currentLanguage === "mm"
                              ? "ပါဝင်သူများ"
                              : "Contributors"}
                          </h3>
                          {/* Row 3: author, publisher (2 columns) */}
                          {renderRow(fieldLayout.row3, 2)}
                          {/* Row 4: editors (full width) */}
                          {fieldLayout.row4.map((field) => (
                            <div
                              key={field.fieldName}
                              className="animate-in slide-in-from-bottom-2"
                            >
                              {renderField(field)}
                            </div>
                          ))}
                          {/* Row 5: additionalAuthors (full width) */}
                          {fieldLayout.row5.map((field) => (
                            <div
                              key={field.fieldName}
                              className="animate-in slide-in-from-bottom-2"
                            >
                              {renderField(field)}
                            </div>
                          ))}
                          {/* Row 5a: subjects (full width) */}
                          {fieldLayout.row5a.map((field) => (
                            <div
                              key={field.fieldName}
                              className="animate-in slide-in-from-bottom-2"
                            >
                              {renderField(field)}
                            </div>
                          ))}
                          {/* Row 5b: degrees (full width) */}
                          {fieldLayout.row5b.map((field) => (
                            <div
                              key={field.fieldName}
                              className="animate-in slide-in-from-bottom-2"
                            >
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Separator */}
                      <hr className="border-border/50" />

                      {/* Section 3: Details */}
                      {(fieldLayout.row6.length > 0 ||
                        fieldLayout.details.length > 0) && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {currentLanguage === "mm"
                              ? "အသေးစိတ်အချက်အလက်"
                              : "Details"}
                          </h3>
                          {/* Row 6: language, year, callNo, edition (4 columns) */}
                          {renderRow(fieldLayout.row6, 4)}
                          {/* Remaining Details Fields */}
                          {fieldLayout.details.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {fieldLayout.details.map((field) => (
                                <div
                                  key={field.fieldName}
                                  className={`${
                                    field.fieldType === "textArea" ||
                                    field.fieldType === "htmlContent"
                                      ? "md:col-span-2"
                                      : ""
                                  } animate-in slide-in-from-bottom-2`}
                                >
                                  {renderField(field)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Separator */}
                      {fieldLayout.files.length > 0 && (
                        <hr className="border-border/50" />
                      )}

                      {/* Section 4: Files */}
                      {fieldLayout.files.length > 0 &&
                        renderFieldGroup(
                          fieldLayout.files,
                          currentLanguage === "mm" ? "ဖိုင်များ" : "Files"
                        )}
                    </div>

                    {/* Metadata Section (only for update) */}
                    {fieldLayout.metadata.length > 0 && action === "update" && (
                      <div className="relative z-0 p-6 space-y-6 border-t border-border/50">
                        {renderFieldGroup(
                          fieldLayout.metadata,
                          currentLanguage === "mm"
                            ? "စနစ် အချက်အလက်များ"
                            : "System Information"
                        )}
                      </div>
                    )}

                    {/* Error Display */}
                    {submitError && (
                      <div className="mx-6 mb-6">
                        <div className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-lg">
                          <div className="flex items-start gap-3">
                            <IconComponent
                              name="AlertTriangle"
                              className="w-5 h-5 text-destructive"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-destructive mb-2">
                                {currentLanguage === "mm"
                                  ? "ဖောင်း အမှားများ တွေ့ရှိပါသည်"
                                  : "Form Submission Error"}
                              </h4>
                              <div className="text-sm text-destructive/90 space-y-1 whitespace-pre-wrap">
                                {submitError}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSubmitError(null)}
                              className="p-1 hover:bg-destructive/10 rounded"
                              title={
                                currentLanguage === "mm" ? "ပိတ်မည်" : "Close"
                              }
                              aria-label={
                                currentLanguage === "mm" ? "ပိတ်မည်" : "Close"
                              }
                            >
                              <IconComponent
                                name="X"
                                className="w-4 h-4 text-destructive"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className="sticky bottom-0 z-10 bg-background border-t border-border/30 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {hasErrors ? (
                            <div className="flex items-center gap-2 text-destructive">
                              <IconComponent
                                name="AlertCircle"
                                className="w-4 h-4"
                              />
                              <span>
                                {currentLanguage === "mm"
                                  ? "ပြင်ဆင်ရန် လိုအပ်ပါသည်"
                                  : "Please fix the errors above"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <IconComponent name="Info" className="w-4 h-4" />
                              <span>
                                {isDirty
                                  ? currentLanguage === "mm"
                                    ? "ပြောင်းလဲမှုများကို သိမ်းဆည်းရန် အဆင်သင့်"
                                    : "Ready to save changes"
                                  : currentLanguage === "mm"
                                  ? "အချက်အလက်များ ဖြည့်စွက်ပါ"
                                  : "Fill in the required fields"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => {
                              reset();
                              setSubmitError(null);
                            }}
                            disabled={
                              isSubmittingForm || isSubmitting || !isDirty
                            }
                          >
                            <IconComponent
                              name="RotateCcw"
                              className="w-4 h-4 mr-2"
                            />
                            {labels.reset}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => router.back()}
                            disabled={isSubmittingForm || isSubmitting}
                          >
                            <IconComponent name="X" className="w-4 h-4 mr-2" />
                            {labels.cancel}
                          </Button>

                          <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmittingForm || isSubmitting}
                            className="min-w-[150px]"
                          >
                            {isSubmittingForm || isSubmitting ? (
                              <>
                                <IconComponent
                                  name="Loader2"
                                  className="w-4 h-4 mr-2 animate-spin"
                                />
                                {labels.saving}
                              </>
                            ) : (
                              <>
                                <IconComponent
                                  name="Plus"
                                  className="w-4 h-4 mr-2"
                                />
                                {labels.create}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </FormProvider>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Wrapper component that provides QueryClient
export function BibliographyForm(props: BibliographyFormProps) {
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
          },
        },
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BibliographyFormInner {...props} />
    </QueryClientProvider>
  );
}
