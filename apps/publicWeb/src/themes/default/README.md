# Class Collection Documentation

## Overview
သုံးလွယ်တဲ့ design system တစ်ခု ဖန်တီးထားပါတယ်။ component တွေမှာ CSS class တွေကို တိုက်ရိုက်မရေးပဲ classCollection ကနေ ယူသုံးပါ။

## Structure

### 1. Base Colors (5 colors)
- **primary**: Main brand color (Blue)
- **secondary**: Supporting color (Dark Gray) 
- **accent**: Highlight color (Teal)
- **neutral**: Text color (Dark Gray)
- **surface**: Background color (White)

### 2. Semantic Colors (4 colors)
- **success**: Green
- **warning**: Amber/Orange
- **danger**: Red
- **info**: Blue (informational)

## Usage Examples

### Button Classes
```tsx
// Primary button
<button className={getButtonClasses('primary', 'default')}>
  Primary Action
</button>

// Success button with outline style
<button className={getButtonClasses('success', 'outline')}>
  Success Action
</button>

// Direct usage
<button className={classCollection.buttons.primary.default}>
  Direct Usage
</button>
```

### Layout Classes
```tsx
// Container
<div className={classCollection.layout.container.type1}>
  Max-width container with padding
</div>

// Flex layouts
<div className={classCollection.layout.flex.between}>
  Flex with justify-between
</div>

// Grid layouts
<div className={classCollection.layout.grid.type1}>
  Responsive grid layout
</div>
```

### Section Layouts
```tsx
// Hero section layout
<section className={classCollection.sectionLayout.type1.container}>
  <div className={classCollection.sectionLayout.type1.content}>
    Hero content
  </div>
</section>
```

### Typography
```tsx
// Headings
<h1 className={classCollection.typography.heading.h1}>
  Main Heading
</h1>

// Body text
<p className={classCollection.typography.body.normal}>
  Normal body text
</p>

// Using helper
<h2 className={getTypographyClasses('heading', 'h2')}>
  Secondary Heading
</h2>
```

### Cards
```tsx
<div className={classCollection.cards.base}>
  <div className={classCollection.cards.header}>
    <h3 className={classCollection.cards.title}>Card Title</h3>
    <p className={classCollection.cards.description}>Description</p>
  </div>
  <div className={classCollection.cards.content}>
    Card content
  </div>
</div>
```

### Alerts
```tsx
// Success alert
<div className={getAlertClasses('success')}>
  Success message
</div>

// Direct usage
<div className={`${classCollection.alerts.base} ${classCollection.alerts.variants.danger}`}>
  Error message
</div>
```

### Forms
```tsx
// Input with error state
<input className={getInputClasses('error')} />

// Label
<label className={classCollection.forms.label}>Email</label>

// Error message
<p className={classCollection.forms.error}>Error message</p>
```

## Helper Functions

### Available Helpers
- `getButtonClasses(variant, style)` - Get button classes
- `getTypographyClasses(type, variant)` - Get typography classes
- `getLayoutClasses(type)` - Get layout classes
- `getAlertClasses(variant)` - Get alert classes
- `getInputClasses(state)` - Get form input classes
- `combineClasses(...classes)` - Safely combine classes
- `getContainerClasses(type)` - Get container classes
- `getFlexClasses(type)` - Get flex classes
- `getGridClasses(type)` - Get grid classes

## Benefits

1. **Consistent Design**: အားလုံးမှာ တူညီတဲ့ design pattern သုံးနိုင်
2. **Easy Maintenance**: classCollection မှာပဲ ပြင်ရင် အားလုံးမှာ update ဖြစ်
3. **Type Safety**: TypeScript support ရှိ
4. **Reusable**: Component တွေမှာ အလွယ်တကူ သုံးနိုင်
5. **No Inline Classes**: Component files တွေမှာ CSS class တွေ မရောနှော

## File Structure
```
themes/default/
├── classCollection.ts      # Main class definitions
├── classUtils.ts          # Helper functions
├── examples.tsx           # Usage examples
└── components/            # Updated components
```

## Migration Strategy

1. **Existing Components**: တစ်ဖြည်းဖြည်း classCollection သုံးအောင် ပြောင်း
2. **New Components**: classCollection ပဲ သုံး
3. **UI Library**: Base components တွေကို classCollection နဲ့ update လုပ်ပြီး
4. **Design Consistency**: Color system ကို standardize လုပ်ပြီး

## Next Steps

1. **More Components**: ကျန်တဲ့ components တွေကို classCollection သုံးအောင် update
2. **Theme Variants**: Dark mode, different themes အတွက် variants တွေ ထပ်ထည့်
3. **Animation Classes**: Animation utilities တွေ ထပ်ထည့်
4. **Responsive Utilities**: Responsive breakpoints တွေအတွက် utilities
