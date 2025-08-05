# Global Theme Configuration Guide

## Overview

Your project now uses a centralized CSS custom properties system where:
- **`:root`** defines all your theme colors as CSS variables
- **`@theme`** references these variables for Tailwind integration
- **`.dark`** overrides colors for dark mode

## How to Change Theme Colors

### Method 1: Direct CSS Variable Changes

Edit `/apps/core/src/app/globals.css` in the `:root` section:

```css
:root {
  /* Change your primary brand color here */
  --color-primary: hsl(220, 91%, 50%); /* Blue theme */
  --color-primary-foreground: hsl(0 0% 98%);
  
  /* Status colors */
  --color-success: hsl(142.1 76.2% 36.3%);
  --color-warning: hsl(32.1 94.6% 43.7%);
  --color-info: hsl(221.2 83.2% 53.3%);
  --color-destructive: hsl(0 84.2% 60.2%);
}
```

### Method 2: Using Theme Utility Functions

```tsx
import { applyThemePreset, applyCustomTheme } from '@/libs/utils/theme-utils';

// Apply a predefined theme
applyThemePreset('blue'); // or 'purple', 'red', 'default'

// Apply custom colors
applyCustomTheme({
  primary: 'hsl(280, 100%, 70%)', // Purple
  secondary: 'hsl(280, 30%, 95%)',
});
```

### Method 3: Using the React Hook

```tsx
import { useTheme } from '@/libs/utils/theme-utils';

function ThemeSelector() {
  const { colors, updateTheme, applyPreset, presets } = useTheme();

  return (
    <div>
      {presets.map(preset => (
        <button key={preset} onClick={() => applyPreset(preset)}>
          {preset} theme
        </button>
      ))}
      
      <button onClick={() => updateTheme({ 
        primary: 'hsl(45, 100%, 50%)' // Golden theme
      })}>
        Custom Golden Theme
      </button>
    </div>
  );
}
```

## Usage in Components

### 1. Tailwind Classes (Recommended)
```tsx
// These automatically use your CSS variables
<div className="bg-primary text-primary-foreground">
  Primary colored div
</div>

<div className="bg-success text-success-foreground">
  Success message
</div>
```

### 2. Direct CSS Variables
```tsx
// Use CSS variables directly
<div style={{
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-primary-foreground)'
}}>
  Custom styled div
</div>
```

### 3. Custom CSS Classes
```css
.my-custom-class {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
```

## Available Color Variables

### Primary Colors
- `--color-primary`
- `--color-primary-foreground`
- `--color-secondary`
- `--color-secondary-foreground`

### Surface Colors
- `--color-background`
- `--color-foreground`
- `--color-card`
- `--color-card-foreground`

### Status Colors
- `--color-success` / `--color-success-foreground`
- `--color-warning` / `--color-warning-foreground`
- `--color-info` / `--color-info-foreground`
- `--color-destructive` / `--color-destructive-foreground`
- `--color-danger`

### Accent Colors
- `--color-muted` / `--color-muted-foreground`
- `--color-accent` / `--color-accent-foreground`

### Form Colors
- `--color-border`
- `--color-input`
- `--color-ring`

### Sidebar Colors
- `--sidebar` / `--sidebar-foreground`
- `--sidebar-primary` / `--sidebar-primary-foreground`
- `--sidebar-accent` / `--sidebar-accent-foreground`

## Predefined Theme Presets

1. **Default** - Green primary theme
2. **Blue** - Blue primary theme
3. **Purple** - Purple primary theme  
4. **Red** - Red primary theme

## Quick Color Changes

### Change Primary Brand Color
```css
:root {
  --color-primary: hsl(YOUR_HUE, YOUR_SATURATION%, YOUR_LIGHTNESS%);
}
```

### Example Brand Colors
```css
/* Spotify Green */
--color-primary: hsl(141, 73%, 42%);

/* Discord Purple */
--color-primary: hsl(235, 86%, 65%);

/* Twitter Blue */
--color-primary: hsl(203, 89%, 53%);

/* YouTube Red */
--color-primary: hsl(358, 79%, 56%);
```

## Dark Mode

Colors automatically adjust in dark mode via the `.dark` class. To customize dark mode colors, edit the `.dark` section in `globals.css`:

```css
.dark {
  --color-primary: hsl(105, 91%, 45%); /* Brighter for dark mode */
  --color-background: hsl(240, 52%, 9%);
  /* ... other dark mode overrides */
}
```

## Benefits of This System

1. **Centralized** - Change theme colors in one place
2. **Consistent** - All components use the same color variables
3. **Dark Mode Ready** - Automatic dark mode support
4. **Tailwind Compatible** - Use standard Tailwind classes
5. **Runtime Changes** - Dynamically change themes with JavaScript
6. **Type Safe** - TypeScript definitions for all colors