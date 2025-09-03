# 🎨 Design System - Semantic Color Tokens

A comprehensive design system using semantic color tokens with automatic light/dark theme support.

## 🌈 Color Palette

### Primary Colors (Blue Theme)
- **Usage**: Main brand elements, primary actions, key UI components
- **Light**: `hsl(220, 100%, 50%)` - Strong blue
- **Dark**: `hsl(220, 100%, 60%)` - Brighter blue for dark mode
- **Variants**: `primary-light`, `primary-dark`

### Secondary Colors (Blue-Grey Theme)  
- **Usage**: Secondary actions, supporting elements, backgrounds
- **Light**: `hsl(220, 60%, 85%)` - Light blue-grey
- **Dark**: `hsl(220, 15%, 25%)` - Dark blue-grey
- **Variants**: `secondary-light`, `secondary-dark`

### Success Colors (Green Theme)
- **Usage**: Success states, positive actions, confirmations
- **Light**: `hsl(142, 76%, 36%)` - Forest green
- **Dark**: `hsl(142, 76%, 45%)` - Brighter green for dark mode
- **Variants**: `success-light`, `success-dark`

### Info Colors (Blue Theme)
- **Usage**: Informational content, neutral actions, data display
- **Light**: `hsl(221, 83%, 53%)` - Information blue
- **Dark**: `hsl(221, 83%, 60%)` - Brighter blue for dark mode
- **Variants**: `info-light`, `info-dark`

### Warning Colors (Orange Theme)
- **Usage**: Warnings, caution states, important notices
- **Light**: `hsl(32, 95%, 44%)` - Orange
- **Dark**: `hsl(32, 95%, 50%)` - Brighter orange for dark mode
- **Variants**: `warning-light`, `warning-dark`

### Danger Colors (Red Theme)
- **Usage**: Errors, destructive actions, critical alerts
- **Light**: `hsl(0, 84%, 60%)` - Red
- **Dark**: `hsl(0, 84%, 65%)` - Brighter red for dark mode
- **Variants**: `danger-light`, `danger-dark`

## 🛠️ CSS Usage

### CSS Variables
```css
/* Direct variable usage */
background-color: var(--color-primary);
color: var(--color-primary-foreground);

/* Hover states */
background-color: var(--color-primary-dark);
```

### Utility Classes
```css
/* Background with automatic foreground */
.bg-primary          /* Primary background + white text */
.bg-primary-light    /* Light variant */
.bg-primary-dark     /* Dark variant */

/* Text colors */
.text-primary        /* Primary text color */
.text-success        /* Success text color */

/* Border colors */
.border-primary      /* Primary border */
.border-danger       /* Danger border */

/* Hover effects */
.hover:bg-primary    /* Hover to primary-dark automatically */
```

## ⚛️ React/JSX Usage

### Using CSS Classes
```tsx
// Primary button
<Button className="bg-primary hover:bg-primary-dark">
  Save Changes
</Button>

// Success notification
<Alert className="bg-success-light border-success">
  <AlertDescription className="text-success-dark">
    Operation completed successfully!
  </AlertDescription>
</Alert>

// Warning badge
<Badge className="bg-warning text-warning-foreground">
  Important
</Badge>
```

### Current Data Table Button Mapping
```tsx
// Select Title - Info semantic (blue)
<Button className="bg-info hover:bg-info-dark">
  📄 Select Title
</Button>

// Print - Success semantic (green)
<Button className="bg-success hover:bg-success-dark">
  🖨️ Print
</Button>

// Export Excel - Success dark variant (darker green)
<Button className="bg-success-dark hover:bg-success">
  📥 Export Excel
</Button>

// Columns - Secondary dark (blue-grey)
<Button className="bg-secondary-dark hover:bg-secondary">
  📋 Columns
</Button>

// Filters - Warning semantic (orange)
<Button className="bg-warning hover:bg-warning-dark">
  🔍 Filters
</Button>

// Settings - Primary semantic (blue)
<Button className="bg-primary hover:bg-primary-dark">
  ⚙️ Settings
</Button>
```

## 🌙 Theme Support

### Automatic Dark Mode
The design system automatically adjusts colors for dark mode:

**Light Mode:**
- Primary: `hsl(220, 100%, 50%)` (Standard blue)
- Success: `hsl(142, 76%, 36%)` (Forest green)

**Dark Mode:**
- Primary: `hsl(220, 100%, 60%)` (Brighter blue)
- Success: `hsl(142, 76%, 45%)` (Brighter green)

### Implementation
Colors automatically switch using CSS custom properties:
```css
:root {
  --color-primary: hsl(220, 100%, 50%);
}

.dark {
  --color-primary: hsl(220, 100%, 60%);
}
```

## 📦 Component Examples

### Buttons
```tsx
// Semantic button variants
<Button className="bg-primary">Primary Action</Button>
<Button className="bg-success">Confirm</Button>
<Button className="bg-warning">Warning</Button>
<Button className="bg-danger">Delete</Button>
<Button className="bg-info">Information</Button>
<Button className="bg-secondary">Secondary</Button>
```

### Alerts & Notifications
```tsx
<Alert className="bg-success-light border-success">
  <CheckIcon className="text-success" />
  <AlertDescription className="text-success-dark">
    Success message
  </AlertDescription>
</Alert>

<Alert className="bg-warning-light border-warning">
  <WarningIcon className="text-warning" />
  <AlertDescription className="text-warning-dark">
    Warning message
  </AlertDescription>
</Alert>
```

### Badges & Labels
```tsx
<Badge className="bg-info">New</Badge>
<Badge className="bg-success">Active</Badge>  
<Badge className="bg-warning">Pending</Badge>
<Badge className="bg-danger">Error</Badge>
```

## 🎯 Best Practices

### 1. Use Semantic Colors
```tsx
// ✅ Good - semantic meaning
<Button className="bg-success">Save</Button>
<Button className="bg-danger">Delete</Button>

// ❌ Avoid - no semantic meaning
<Button className="bg-green-500">Save</Button>
<Button className="bg-red-500">Delete</Button>
```

### 2. Leverage Variants
```tsx
// ✅ Good - using light variant for subtle backgrounds
<div className="bg-success-light border border-success">
  <p className="text-success-dark">Success content</p>
</div>
```

### 3. Consistent Hover States
```tsx
// ✅ Good - automatic darker variant on hover
<Button className="bg-primary hover:bg-primary-dark">
  Action
</Button>
```

### 4. Theme Awareness
All colors automatically adapt to light/dark themes - no additional work required!

## 🔧 Extending the System

### Adding New Semantic Colors
1. Define in `:root` for light mode
2. Override in `.dark` for dark mode  
3. Add to `@theme` section
4. Create utility classes

```css
:root {
  --color-accent: hsl(280, 70%, 50%);
  --color-accent-foreground: hsl(0, 0%, 98%);
}

.dark {
  --color-accent: hsl(280, 70%, 60%);
}

.bg-accent { 
  background-color: var(--color-accent) !important; 
  color: var(--color-accent-foreground) !important; 
}
```

## 📊 Design Tokens Reference

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|--------|
| `primary` | `hsl(220, 100%, 50%)` | `hsl(220, 100%, 60%)` | Brand, primary actions |
| `secondary` | `hsl(220, 60%, 85%)` | `hsl(220, 15%, 25%)` | Secondary elements |
| `success` | `hsl(142, 76%, 36%)` | `hsl(142, 76%, 45%)` | Success states |
| `info` | `hsl(221, 83%, 53%)` | `hsl(221, 83%, 60%)` | Information |
| `warning` | `hsl(32, 95%, 44%)` | `hsl(32, 95%, 50%)` | Warnings |
| `danger` | `hsl(0, 84%, 60%)` | `hsl(0, 84%, 65%)` | Errors, destruction |

---

*This design system ensures consistent theming across the entire application with automatic light/dark mode support and semantic meaning for all color choices.*