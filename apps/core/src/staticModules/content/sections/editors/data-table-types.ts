import { z } from 'zod';

// DataTable section — shape mirrors the backend persistence model
// (`DataTableSectionSchema`):
//   table: { columns[], rows[] }
//   features: { search, sort, filter, pagination, export }
//   styling: { striped, bordered, hover, compact }
//   rowsPerPage
// `columns[].label` is multi-lang; `rows[]` is `Record<columnKey, any>`
// where any can be a primitive or a multi-lang `{ en, mm? }` object —
// the public-web renderer accepts either via `String(row[col.key])`.

const spacingSchema = z
  .object({
    paddingTop: z.string().optional(),
    paddingBottom: z.string().optional(),
    paddingLeft: z.string().optional(),
    paddingRight: z.string().optional(),
    marginTop: z.string().optional(),
    marginBottom: z.string().optional(),
  })
  .optional();

const containerSettingsSchema = z
  .object({
    width: z.enum(['fullWidth', 'contained', 'custom']),
    maxWidth: z.string().optional(),
    padding: z
      .object({
        left: z.string().optional(),
        right: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const responsiveSettingsSchema = z
  .object({
    hideOnMobile: z.boolean().optional(),
    hideOnTablet: z.boolean().optional(),
    hideOnDesktop: z.boolean().optional(),
  })
  .optional();

const textColorsSchema = z
  .object({
    headline: z.string().optional(),
    description: z.string().optional(),
    header: z.string().optional(),
    body: z.string().optional(),
  })
  .optional();

export const dataTableColumnSchema = z.object({
  key: z.string().min(1, 'Column key is required'),
  label: z.object({
    en: z.string().min(1, 'Label (EN) is required'),
    mm: z.string().optional(),
  }),
  type: z
    .enum(['text', 'number', 'date', 'boolean', 'currency', 'percentage'])
    .default('text'),
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(true),
  width: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
});

// Row cell value — accepts either a plain string or a multi-lang object.
// The form authors enter free-text; renderers stringify whatever shape
// they receive.
const cellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.object({ en: z.string().optional(), mm: z.string().optional() }),
]);

export const dataTableRowSchema = z.record(z.string(), cellValueSchema);

export const dataTableTableSchema = z.object({
  columns: z
    .array(dataTableColumnSchema)
    .min(1, 'Add at least one column')
    .max(10, 'Up to 10 columns supported per table'),
  rows: z.array(dataTableRowSchema).default([]),
});

export const dataTableFeaturesSchema = z
  .object({
    search: z.boolean().default(true),
    sort: z.boolean().default(true),
    filter: z.boolean().default(true),
    pagination: z.boolean().default(true),
    export: z.boolean().default(false),
  })
  .optional();

export const dataTableStylingSchema = z
  .object({
    striped: z.boolean().default(true),
    bordered: z.boolean().default(true),
    hover: z.boolean().default(true),
    compact: z.boolean().default(false),
  })
  .optional();

export const dataTableSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  title: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  headline: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  description: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  caption: z
    .object({
      en: z.string().optional(),
      mm: z.string().optional(),
    })
    .optional(),
  table: dataTableTableSchema,
  features: dataTableFeaturesSchema,
  styling: dataTableStylingSchema,
  rowsPerPage: z.number().int().min(1).max(100).default(10),
  textColors: textColorsSchema,
  headlineSize: z.number().min(16).max(72).optional(),
  spacing: spacingSchema,
  containerSettings: containerSettingsSchema,
  responsiveSettings: responsiveSettingsSchema,
  isVisible: z.boolean().default(true),
  isReusable: z.boolean().default(false),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  order: z.number().min(0).optional(),
});

export type DataTableColumnFormData = z.infer<typeof dataTableColumnSchema>;
export type DataTableRowFormData = z.infer<typeof dataTableRowSchema>;
export type DataTableTableFormData = z.infer<typeof dataTableTableSchema>;
export type DataTableFeaturesFormData = z.infer<typeof dataTableFeaturesSchema>;
export type DataTableStylingFormData = z.infer<typeof dataTableStylingSchema>;
export type DataTableSectionFormData = z.infer<typeof dataTableSectionSchema>;
