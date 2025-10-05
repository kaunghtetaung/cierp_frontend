# Theme Assets Directory

This directory contains theme-specific assets for the publicWeb application.

## Structure

```
themes/
├── default/        # Default theme
├── crystal/        # Crystal theme
└── um1/            # UM1 theme
```

Each theme has the following structure:

```
theme-name/
├── images/
│   ├── backgrounds/  # Background images (.jpg, .png, .webp)
│   ├── logos/        # Logo images
│   └── patterns/     # Pattern images
└── svg/
    ├── icons/        # Custom SVG icons
    └── patterns/     # SVG patterns
```

## Adding Assets

1. Place your assets in the appropriate theme directory
2. Use descriptive names (e.g., `hero-bg.jpg`, not `bg1.jpg`)
3. Optimize images before adding them

## Usage

See `/THEME-ASSETS-GUIDE.md` for complete usage instructions.

Quick example:
```tsx
import { getThemeAsset } from '@/lib/theme-assets';

<img src={getThemeAsset('images/logos/logo.png')} alt="Logo" />
```
