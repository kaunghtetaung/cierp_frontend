# @repo/hooks

A collection of reusable React hooks for the monorepo.

## Installation

This package is part of the monorepo and can be imported as:

```typescript
import { useIsMobile } from '@repo/hooks'
```

## Available Hooks

### useIsMobile()

Detects if the current viewport is mobile-sized (below 768px).

```typescript
function MyComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div>
      {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
    </div>
  )
}
```

**Returns:** `boolean` - `true` if viewport width is below 768px

**Features:**
- ✅ SSR safe (returns `false` during server-side rendering)
- ✅ Uses MediaQuery API for efficient updates
- ✅ Automatically cleans up event listeners
- ✅ TypeScript support

### useMediaQuery(breakpoint)

Similar to `useIsMobile` but with a custom breakpoint.

```typescript
function MyComponent() {
  const isSmall = useMediaQuery(640) // Custom 640px breakpoint
  const isMedium = useMediaQuery(1024) // Custom 1024px breakpoint
  
  return (
    <div>
      {isSmall && 'Small screen'}
      {isMedium && !isSmall && 'Medium screen'}
      {!isMedium && 'Large screen'}
    </div>
  )
}
```

**Parameters:**
- `breakpoint` (optional): Custom breakpoint in pixels (default: 768)

**Returns:** `boolean` - `true` if viewport width is below the breakpoint

## Common Use Cases

### Conditional Rendering
```typescript
const isMobile = useIsMobile()

return (
  <div>
    {isMobile ? (
      <MobileLayout />
    ) : (
      <DesktopLayout />
    )}
  </div>
)
```

### Sidebar Behavior
```typescript
const isMobile = useIsMobile()

return (
  <Sidebar 
    collapsible={isMobile ? "offcanvas" : "icon"}
    variant={isMobile ? "floating" : "sidebar"}
  />
)
```

### Navigation Menus
```typescript
const isMobile = useIsMobile()

return (
  <nav>
    {isMobile ? (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <NavigationItems />
        </SheetContent>
      </Sheet>
    ) : (
      <NavigationMenu>
        <NavigationItems />
      </NavigationMenu>
    )}
  </nav>
)
```

## Technical Notes

- Uses `window.matchMedia()` for efficient media query listening
- Initial state is `undefined` to prevent hydration mismatches in SSR
- Event listeners are automatically cleaned up on component unmount
- Defaults to mobile breakpoint of 768px (typical tablet/mobile boundary)

## Browser Support

Supports all modern browsers that implement the MediaQuery API (IE10+).