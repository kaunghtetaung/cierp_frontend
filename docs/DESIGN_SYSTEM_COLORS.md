# Design System Colors

Our design system has been enhanced with a comprehensive 8-color system that combines 5 core semantic colors with 3 additional semantic status colors for maximum flexibility and clear communication.

## Core 5-Color System

### 1. Primary (Blue)
- **Usage**: Main brand color, primary actions, key interactive elements
- **CSS Variable**: `--primary: 221.2 83.2% 53.3%`
- **Tailwind Classes**: `bg-primary`, `text-primary`, `border-primary`
- **Examples**: Primary buttons, active navigation, main headings

### 2. Secondary (Dark Gray)
- **Usage**: Supporting elements, structural components, secondary actions
- **CSS Variable**: `--secondary: 215 25% 27%`
- **Tailwind Classes**: `bg-secondary`, `text-secondary`, `border-secondary`
- **Examples**: Secondary buttons, borders, supporting text

### 3. Accent (Teal)
- **Usage**: Highlights, call-to-action elements, interactive states
- **CSS Variable**: `--accent: 174 72% 56%`
- **Tailwind Classes**: `bg-accent`, `text-accent`, `border-accent`
- **Examples**: Feature highlights, icons, hover states

### 4. Neutral (Text)
- **Usage**: Main text content, body copy, readable text
- **CSS Variable**: `--foreground: 222.2 84% 4.9%`
- **Tailwind Classes**: `text-neutral`
- **Examples**: Headings, paragraphs, labels

### 5. Surface (White)
- **Usage**: Background surfaces, cards, content areas
- **CSS Variable**: `--background: 0 0% 100%`
- **Tailwind Classes**: `bg-surface`
- **Examples**: Card backgrounds, main background, content containers

## Semantic Status Colors

### 6. Success (Green)
- **Usage**: Success states, confirmations, positive feedback
- **CSS Variable**: `--success: 142 76% 36%`
- **Tailwind Classes**: `bg-success`, `text-success`, `border-success`
- **Examples**: Success messages, completed states, positive indicators
- **Component Variants**: `<Button variant="success">`, `<Alert variant="success">`

### 7. Warning (Amber/Orange)
- **Usage**: Warning states, attention required, caution
- **CSS Variable**: `--warning: 38 92% 50%`
- **Tailwind Classes**: `bg-warning`, `text-warning`, `border-warning`
- **Examples**: Warning alerts, pending states, caution indicators
- **Component Variants**: `<Button variant="warning">`, `<Alert variant="warning">`

### 8. Danger (Red)
- **Usage**: Error states, destructive actions, critical alerts
- **CSS Variable**: `--destructive: 0 84.2% 60.2%`
- **Tailwind Classes**: `bg-danger`, `text-danger`, `border-danger`
- **Examples**: Error messages, delete buttons, critical warnings
- **Component Variants**: `<Button variant="destructive">`, `<Alert variant="destructive">`

## Additional Semantic Color

### Info (Blue)
- **Usage**: Informational messages, neutral updates, general information
- **CSS Variable**: `--info: 221.2 83.2% 53.3%`
- **Tailwind Classes**: `bg-info`, `text-info`, `border-info`
- **Examples**: Info alerts, tips, neutral notifications
- **Component Variants**: `<Button variant="info">`, `<Alert variant="info">`

## Usage Guidelines

### Color Opacity Patterns
Each color supports opacity modifiers for subtle backgrounds and borders:

```css
/* Light backgrounds */
bg-success/10    /* 10% opacity */
bg-warning/20    /* 20% opacity */

/* Borders */
border-danger/30    /* 30% opacity */
border-info/40      /* 40% opacity */

/* Text variations */
text-success/90     /* 90% opacity */
text-neutral/70     /* 70% opacity */
```

### Component Integration

#### Buttons
```tsx
<Button variant="success">Complete Action</Button>
<Button variant="warning">Proceed with Caution</Button>
<Button variant="destructive">Delete Item</Button>
<Button variant="info">Learn More</Button>
```

#### Alerts
```tsx
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>Operation completed successfully.</AlertDescription>
</Alert>

<Alert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Please review your input.</AlertDescription>
</Alert>

<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

#### Status Badges
```tsx
<span className="bg-success/10 border border-success/30 text-success px-3 py-1 rounded-theme-badge">
  Active
</span>

<span className="bg-warning/10 border border-warning/30 text-warning px-3 py-1 rounded-theme-badge">
  Pending
</span>

<span className="bg-danger/10 border border-danger/30 text-danger px-3 py-1 rounded-theme-badge">
  Inactive
</span>
```

### Best Practices

1. **Consistency**: Use the same color for the same meaning across all components
2. **Contrast**: Ensure proper contrast ratios for accessibility
3. **Hierarchy**: Use color to create visual hierarchy and guide user attention
4. **Context**: Choose colors that match the context and user expectations

### Dark Mode Support

All colors automatically adapt to dark mode with appropriate adjustments:

```css
.dark {
  --success: 142 76% 42%;     /* Brighter for dark backgrounds */
  --warning: 38 92% 60%;      /* Adjusted brightness */
  --destructive: 0 62.8% 60.5%; /* Softer red */
  --info: 221.2 83.2% 63.3%;   /* Brighter blue */
}
```

### Implementation Examples

#### Status Indicators in Pricing Cards
```tsx
const getStatusBadge = (plan) => {
  if (plan.status === 'limited') {
    return {
      className: 'bg-warning/10 border-warning/30 text-warning',
      icon: Zap,
      text: 'Limited Time'
    };
  }
  if (plan.status === 'recommended') {
    return {
      className: 'bg-success/10 border-success/30 text-success',
      icon: Star,
      text: 'Best Value'
    };
  }
  // ... other statuses
};
```

#### Form Validation
```tsx
<input 
  className={`
    border rounded-theme-input px-3 py-2
    ${hasError 
      ? 'border-danger/50 focus:border-danger focus:ring-danger/20' 
      : 'border-neutral/30 focus:border-primary focus:ring-primary/20'
    }
  `}
/>
{hasError && (
  <p className="text-danger text-sm mt-1">
    {errorMessage}
  </p>
)}
```

## Migration Guide

If you're updating from the previous 5-color system:

1. **Update Tailwind Config**: The semantic status colors are now available
2. **Replace Old Patterns**: 
   - `text-red-500` → `text-danger`
   - `bg-green-100` → `bg-success/10`
   - `border-yellow-300` → `border-warning/30`
3. **Use Component Variants**: Leverage the new button and alert variants
4. **Update Custom Components**: Apply the new color system to custom components

## Color Variables Reference

```css
/* Core Colors */
--primary: 221.2 83.2% 53.3%;
--secondary: 215 25% 27%;
--accent: 174 72% 56%;
--background: 0 0% 100%;         /* Surface */
--foreground: 222.2 84% 4.9%;    /* Neutral */

/* Semantic Status Colors */
--success: 142 76% 36%;
--warning: 38 92% 50%;
--destructive: 0 84.2% 60.2%;    /* Danger */
--info: 221.2 83.2% 53.3%;

/* Foreground Colors */
--success-foreground: 0 0% 100%;
--warning-foreground: 0 0% 100%;
--destructive-foreground: 210 40% 98%;
--info-foreground: 210 40% 98%;
```

This enhanced color system provides a solid foundation for creating consistent, accessible, and meaningful user interfaces across all components and sections.