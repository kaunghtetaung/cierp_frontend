# 🎨 Theme Assets Guide - PublicWeb

Complete guide for using theme-specific images and SVG files in the publicWeb application.

## 📁 Directory Structure

```
apps/publicWeb/public/
├── themes/
│   ├── default/              # Default theme assets
│   │   ├── images/
│   │   │   ├── backgrounds/  # Background images
│   │   │   ├── logos/        # Logo images
│   │   │   └── patterns/     # Pattern images
│   │   └── svg/
│   │       ├── icons/        # Custom SVG icons
│   │       └── patterns/     # SVG patterns
│   ├── crystal/              # Crystal theme assets (same structure)
│   └── um1/                  # UM1 theme assets (same structure)
└── shared/                   # Assets shared across all themes
    ├── images/
    └── svg/
```

## 🚀 Quick Start

### 1. Import the utilities

```tsx
import {
  getThemeAsset,
  getSharedAsset,
  getThemeBackground,
  getThemeSvgPattern,
  getAsset
} from '@/lib/theme-assets';
```

### 2. Use in Components

#### Simple Image
```tsx
// Theme-specific image
<img src={getThemeAsset('images/logos/logo.png')} alt="Logo" />

// Shared image (used across all themes)
<img src={getSharedAsset('images/common-icon.png')} alt="Icon" />
```

#### Background Images
```tsx
// CSS background
<div style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}>
  <h1>Hero Section</h1>
</div>

// Tailwind with arbitrary value
<div className="bg-cover" style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}>
  Content
</div>
```

#### SVG Patterns
```tsx
<div style={{ backgroundImage: getThemeSvgPattern('patterns/dots.svg') }}>
  Content with pattern background
</div>
```

#### Type-Safe Asset Loading
```tsx
// Using predefined asset paths
const heroPath = getAsset('backgrounds', 'hero');
const logoPath = getAsset('logos', 'main');

<img src={logoPath} alt="Logo" />
```

### 3. Tailwind CSS Integration

You can also configure Tailwind to use theme assets:

```js
// tailwind.config.js
const { getThemeAsset } = require('./src/lib/theme-assets');

module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'hero': `url('${getThemeAsset('images/backgrounds/hero.jpg')}')`,
        'pattern-dots': `url('${getThemeAsset('svg/patterns/dots.svg')}')`,
      }
    }
  }
}

// Usage in components
<div className="bg-hero bg-cover">Hero Section</div>
```

## 📚 API Reference

### `getThemeAsset(path, theme?, fallbackToShared?)`
Get theme-specific asset path.

**Parameters:**
- `path` (string): Asset path relative to theme directory
- `theme` (optional): Theme name ('default', 'crystal', 'um1')
- `fallbackToShared` (optional): Whether to fallback to shared assets

**Returns:** Full public path to the asset

**Examples:**
```tsx
getThemeAsset('images/backgrounds/hero.jpg')
// => '/themes/default/images/backgrounds/hero.jpg'

getThemeAsset('images/logos/logo.png', 'crystal')
// => '/themes/crystal/images/logos/logo.png'
```

---

### `getSharedAsset(path)`
Get shared asset path (used across all themes).

**Parameters:**
- `path` (string): Asset path relative to shared directory

**Returns:** Full public path to the shared asset

**Examples:**
```tsx
getSharedAsset('images/common-icon.png')
// => '/shared/images/common-icon.png'
```

---

### `getThemeBackground(path, theme?)`
Get theme-specific background image URL for CSS.

**Parameters:**
- `path` (string): Image path relative to theme images directory
- `theme` (optional): Theme name

**Returns:** CSS url() string

**Examples:**
```tsx
getThemeBackground('backgrounds/hero.jpg')
// => "url('/themes/default/images/backgrounds/hero.jpg')"

// Usage
<div style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}>
```

---

### `getThemeSvgPattern(path, theme?)`
Get theme-specific SVG pattern URL for CSS.

**Parameters:**
- `path` (string): SVG path relative to theme svg directory
- `theme` (optional): Theme name

**Returns:** CSS url() string

**Examples:**
```tsx
getThemeSvgPattern('patterns/dots.svg')
// => "url('/themes/default/svg/patterns/dots.svg')"
```

---

### `getAsset(category, name, theme?)`
Type-safe asset getter using predefined paths.

**Parameters:**
- `category` ('backgrounds' | 'logos' | 'patterns' | 'icons')
- `name` (string): Asset name from configuration
- `theme` (optional): Theme name

**Returns:** Full public path to the asset

**Examples:**
```tsx
getAsset('backgrounds', 'hero')
// => '/themes/default/images/backgrounds/hero.jpg'

getAsset('logos', 'main', 'crystal')
// => '/themes/crystal/images/logos/logo.png'
```

---

### `getCurrentTheme()`
Get the current active theme name.

**Returns:** ThemeName ('default' | 'crystal' | 'um1')

**Note:** Currently reads from localStorage. Extend this function to:
- Read from environment variable
- Read from user context/session
- Read from URL subdomain
- Read from database based on tenant

---

### `preloadThemeAssets(assets, theme?)`
Preload theme assets for better performance.

**Parameters:**
- `assets` (string[]): Array of asset paths to preload
- `theme` (optional): Theme name

**Examples:**
```tsx
// In your app initialization
preloadThemeAssets([
  'images/backgrounds/hero.jpg',
  'images/logos/logo.png',
  'svg/patterns/dots.svg'
]);
```

## 🎯 Common Use Cases

### 1. Hero Section with Background
```tsx
export function Hero() {
  return (
    <section
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: getThemeBackground('backgrounds/hero.jpg') }}
    >
      <div className="container mx-auto">
        <h1>Welcome</h1>
      </div>
    </section>
  );
}
```

### 2. Logo Component
```tsx
export function Logo({ variant = 'main' }: { variant?: 'main' | 'white' | 'icon' }) {
  const logoSrc = getAsset('logos', variant);

  return (
    <img
      src={logoSrc}
      alt="Logo"
      className="h-10 w-auto"
    />
  );
}
```

### 3. Pattern Background
```tsx
export function PatternSection() {
  return (
    <div
      className="py-12"
      style={{ backgroundImage: getThemeSvgPattern('patterns/dots.svg') }}
    >
      <div className="container mx-auto">
        Content with pattern background
      </div>
    </div>
  );
}
```

### 4. Theme-Specific Card
```tsx
export function Card() {
  const cardBg = getThemeAsset('images/patterns/card-pattern.png');

  return (
    <div
      className="rounded-lg p-6"
      style={{ backgroundImage: `url('${cardBg}')` }}
    >
      Card content
    </div>
  );
}
```

## 🔧 Customizing Theme Detection

Edit `src/lib/theme-assets.ts` and modify the `getCurrentTheme()` function:

```tsx
// Example: Read from environment variable
export function getCurrentTheme(): ThemeName {
  const envTheme = process.env.NEXT_PUBLIC_THEME;
  if (envTheme && ['default', 'crystal', 'um1'].includes(envTheme)) {
    return envTheme as ThemeName;
  }
  return 'default';
}

// Example: Read from user context
export function getCurrentTheme(): ThemeName {
  const user = useUser(); // Your user hook
  return user?.theme || 'default';
}

// Example: Read from subdomain
export function getCurrentTheme(): ThemeName {
  if (typeof window !== 'undefined') {
    const subdomain = window.location.hostname.split('.')[0];
    if (['default', 'crystal', 'um1'].includes(subdomain)) {
      return subdomain as ThemeName;
    }
  }
  return 'default';
}
```

## 📝 Adding New Themes

1. Create theme directory structure:
```bash
mkdir -p public/themes/newtheme/{images/{backgrounds,logos,patterns},svg/{patterns,icons}}
```

2. Update the ThemeName type in `src/lib/theme-assets.ts`:
```tsx
export type ThemeName = 'default' | 'crystal' | 'um1' | 'newtheme';
```

3. Add your assets to the new theme directory.

## 💡 Best Practices

1. **Organize by purpose**: Use subdirectories (backgrounds, logos, patterns, icons)
2. **Consistent naming**: Use descriptive names (hero-bg.jpg, not bg1.jpg)
3. **Optimize images**: Compress images before adding to public directory
4. **Use WebP format**: For better performance where supported
5. **Preload critical assets**: Use `preloadThemeAssets()` for above-the-fold images
6. **Type-safe paths**: Use `getAsset()` with predefined paths when possible
7. **Fallback to shared**: For truly universal assets, use `/shared/` directory

## 🚀 Performance Tips

1. **Lazy load non-critical images**:
```tsx
<img
  src={getThemeAsset('images/large-image.jpg')}
  loading="lazy"
  alt="Description"
/>
```

2. **Use Next.js Image component** for optimization:
```tsx
import Image from 'next/image';

<Image
  src={getThemeAsset('images/hero.jpg')}
  alt="Hero"
  width={1920}
  height={1080}
  priority
/>
```

3. **Preload critical assets** early in your app.

## 📦 Example Asset Configuration

Update `themeAssetPaths` in `src/lib/theme-assets.ts` to define all your assets:

```tsx
export const themeAssetPaths = {
  backgrounds: {
    hero: 'images/backgrounds/hero.jpg',
    pattern: 'images/backgrounds/pattern.png',
    gradient: 'images/backgrounds/gradient.jpg',
    library: 'images/backgrounds/library-bg.jpg',
  },
  logos: {
    main: 'images/logos/logo.png',
    icon: 'images/logos/icon.png',
    white: 'images/logos/logo-white.png',
  },
  patterns: {
    dots: 'svg/patterns/dots.svg',
    grid: 'svg/patterns/grid.svg',
    waves: 'svg/patterns/waves.svg',
  },
  icons: {
    search: 'svg/icons/search.svg',
    menu: 'svg/icons/menu.svg',
  }
} as const;
```

---

**Questions or Issues?** Check the source code in `/src/lib/theme-assets.ts` or create an issue in the project repository.
