# AppBreadcrumb Component

A custom breadcrumb component that automatically generates breadcrumbs based on your application's route structure.

## Route Structure

The breadcrumb system understands your app's specific route pattern:

```
/{x-app-id}/{module}/{action}
```

- **x-app-id**: Your application identifier (root level)
- **module**: The specific module/feature (e.g., user, product, order)
- **action**: The action being performed (list, new, edit, view, etc.)

## Examples

### Route: `/myapp/user/list`
**Breadcrumb**: Dashboard > Users > List

### Route: `/myapp/product/new`
**Breadcrumb**: Dashboard > Products > New

### Route: `/myapp/order/123/edit`
**Breadcrumb**: Dashboard > Orders > Item 123 > Edit

## Usage

```tsx
import { AppBreadcrumb } from "@/components/common/AppBreadcrumb";

// Basic usage
<AppBreadcrumb />

// With custom module names
<AppBreadcrumb 
  moduleDisplayNames={{
    user: "User Management",
    product: "Products",
    order: "Order Management"
  }}
/>

// With custom action names
<AppBreadcrumb 
  actionDisplayNames={{
    list: "All Items",
    new: "Create New",
    edit: "Edit Item"
  }}
/>
```

## Features

- **Automatic route parsing**: Parses current URL to generate breadcrumbs
- **Localization support**: Uses language context for multilingual support
- **Customizable labels**: Override default display names for modules and actions
- **Responsive design**: Hidden on mobile by default
- **Accessible**: Proper ARIA attributes and semantic markup
- **Smart truncation**: Limits breadcrumb length with ellipsis
- **Home icon**: Optional home icon for the first breadcrumb

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `""` | Additional CSS classes |
| `showHomeIcon` | `boolean` | `true` | Show home icon on first breadcrumb |
| `maxItems` | `number` | `5` | Maximum breadcrumbs before truncation |
| `moduleDisplayNames` | `Record<string, string>` | `{}` | Custom module display names |
| `actionDisplayNames` | `Record<string, string>` | `{}` | Custom action display names |

## Localization

The component automatically uses your app's language context and includes default translations for common actions:

- **English**: List, New, Edit, View, Settings, Details
- **Myanmar**: စာရင်း, အသစ်, ပြင်ဆင်, ကြည့်ရှု, ဆက်တင်များ, အသေးစိတ်

## Integration

The breadcrumb is automatically integrated into the header component and will update based on the current route.