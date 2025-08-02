# Components Organization Guide

## 📁 Folder Structure

```
publicWeb/src/
├── base-components/           # 🧱 Pure functional components (no styling)
│   ├── ui/
│   │   ├── button.tsx        # Raw button functionality
│   │   ├── input.tsx         # Input structure only
│   │   └── modal.tsx         # Modal behavior only
│   └── README.md
│
├── feature-components/        # ⚙️ Business logic components 
│   ├── search/
│   │   └── SearchBox.tsx     # Search functionality
│   ├── user-menu/
│   │   └── UserMenu.tsx      # User management logic
│   └── README.md
│
├── styled-components/         # 🎨 Final styled components
│   ├── ui/
│   │   ├── Button.tsx        # Button + styling
│   │   └── Input.tsx         # Input + styling
│   ├── layout/
│   │   ├── Header.tsx        # Complete header with styles
│   │   └── Footer.tsx        # Complete footer with styles
│   └── README.md
│
└── themes/                    # 🎭 Theme configurations
    └── default/
        ├── styles/
        └── layouts/
```

## 🔄 Component Flow

```
base-components → feature-components → styled-components → pages
    (structure)       (logic)           (styling)        (usage)
```

## 📖 Usage Examples

### ❌ Wrong Way
```tsx
// Don't import base components directly in pages
import { Button } from '@/base-components/ui/button'
```

### ✅ Right Way
```tsx
// Import styled components in pages
import { Button } from '@/styled-components/ui/Button'
import { SearchBox } from '@/styled-components/search/SearchBox'
```

## 🎯 Benefits

- **Clear separation**: Structure vs Logic vs Styling
- **Reusable**: Base components work across themes
- **Maintainable**: Easy to update without breaking things
- **Developer friendly**: Clear purpose for each folder
