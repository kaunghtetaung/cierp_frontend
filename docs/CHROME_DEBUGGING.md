# Chrome DevTools Debugging Guide for Next.js

## Setup Instructions

### 1. Enable Source Maps (Already Done)
The `next.config.js` has been configured with `source-map` for the best debugging experience.

### 2. Open Chrome DevTools
1. Open Chrome browser
2. Navigate to http://www.crystal-image.net
3. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows) to open DevTools

## Debugging Client-Side Code

### Method 1: Using Breakpoints in Sources Panel
1. In DevTools, go to **Sources** tab
2. In the left panel, navigate to:
   - `webpack://` → `apps` → `core` → `src`
   - Find your component files (e.g., `components/forms/DynamicSelect.tsx`)
3. Click on line numbers to set breakpoints
4. Refresh the page or trigger the code to hit the breakpoint

### Method 2: Using debugger Statement
Add `debugger;` statements in your code where you want to pause:

```typescript
// In TypeaheadDynamicSelect.tsx
const handleSearchChange = useCallback((value: string) => {
  debugger; // Execution will pause here when DevTools is open
  setSearchTerm(value);
  setDisplayValue(value);
  // ... rest of the code
}, []);
```

### Method 3: Using Console Breakpoints
1. In Sources panel, press `Ctrl+Shift+F` (Cmd+Shift+F on Mac)
2. Search for specific function names or text
3. Right-click on the line → "Add conditional breakpoint"
4. Add conditions like `field.fieldName === 'author'`

## React Developer Tools

### Install React DevTools Extension
1. Install from Chrome Web Store: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
2. After installation, you'll see two new tabs in DevTools:
   - **Components**: Inspect React component tree
   - **Profiler**: Analyze performance

### Using React DevTools
1. Open **Components** tab
2. Navigate the component tree
3. Select a component to see:
   - Props
   - State
   - Hooks
   - Context
4. You can edit props/state values live to test behavior

## Debugging TypeaheadDynamicSelect

### Key Areas to Debug
1. **Data Fetching**: Set breakpoint in `fetchOptions` function
2. **Search Input**: Set breakpoint in `handleSearchChange`
3. **Render Logic**: Set breakpoint at component start

### Example Debug Session
```typescript
// Add temporary debug code
export function TypeaheadDynamicSelect({...props}) {
  // Debug: Check if component is receiving correct props
  console.group(`TypeaheadDynamicSelect: ${field.fieldName}`);
  console.log('Enable Typeahead:', field.dataSource?.enableTypeahead);
  console.log('Initial Value:', value);
  console.groupEnd();
  
  // Set breakpoint here to inspect initial state
  debugger;
  
  const fetchOptions = useCallback(async (searchTerm: string) => {
    // Debug: Check search parameters
    console.log('Fetching with search:', searchTerm);
    debugger; // Pause to inspect network request
    // ... rest of code
  }, []);
}
```

## Network Debugging

### Monitor API Calls
1. Open **Network** tab
2. Filter by `Fetch/XHR`
3. Look for requests to your API endpoints
4. Click on requests to see:
   - Headers
   - Payload
   - Response
   - Timing

### Debug Typeahead API Calls
1. Type in a typeahead field
2. Watch Network tab for API calls
3. Check if search parameter is being sent correctly
4. Verify response format

## Performance Debugging

### Using Performance Tab
1. Open **Performance** tab
2. Click record button
3. Interact with your typeahead fields
4. Stop recording
5. Analyze:
   - Component render times
   - JavaScript execution
   - Layout/Paint operations

## Chrome DevTools Shortcuts

- `Cmd/Ctrl + P`: Quick file open
- `Cmd/Ctrl + Shift + P`: Command palette
- `Cmd/Ctrl + D`: Select next occurrence
- `Cmd/Ctrl + G`: Go to line
- `F8`: Resume script execution
- `F10`: Step over
- `F11`: Step into
- `Shift + F11`: Step out

## Troubleshooting

### Source Maps Not Working?
1. Clear browser cache: `Cmd/Ctrl + Shift + Delete`
2. Restart dev server
3. Check Network tab for `.map` files loading

### Can't Find Your Files?
1. Look under `webpack://` in Sources panel
2. Use `Cmd/Ctrl + P` to search by filename
3. Check if running in development mode

### Breakpoints Not Hitting?
1. Ensure Chrome DevTools is open before triggering code
2. Check if code is actually executing (add console.log)
3. Try using `debugger;` statement instead

## Best Practices

1. **Remove debugger statements** before committing code
2. **Use conditional breakpoints** for specific scenarios
3. **Leverage React DevTools** for component state debugging
4. **Monitor Network tab** for API issues
5. **Use Performance tab** for optimization

## VSCode Integration (Alternative)

You can also debug from VSCode using the launch configurations in `.vscode/launch.json`:
1. Set breakpoints in VSCode
2. Press F5 to start debugging
3. Chrome will open with debugging enabled
4. Breakpoints will pause in VSCode instead of Chrome