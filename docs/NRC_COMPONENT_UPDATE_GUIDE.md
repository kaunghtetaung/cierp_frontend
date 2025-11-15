# NRC Component Lazy Loading Update Guide

This guide shows how to update NRC components to use lazy loading with the new data structure.

## Changes Required

### 1. **Core App NrcField** (`libs/schema-forms/NrcField.tsx`)

#### Step 1: Update Imports
```typescript
// REMOVE these lines:
import nrcData from "../../NRC_Data.json";

// ADD this line:
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";
```

#### Step 2: Update Component Function
```typescript
export function NrcField({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  error = false,
  config = {},
  className,
  onToggleChange,
  isFreeForm: externalIsFreeForm,
  fieldName = "nrc",
  isGuardianMirrored = false
}: NrcFieldProps) {
  // ... existing config destructuring ...

  // ADD: Lazy load data with hooks
  const { states, isLoading: statesLoading } = useNrcStates();
  const { townships, isLoading: townshipsLoading } = useNrcTownships(parts.state);
  const { types, isLoading: typesLoading } = useNrcTypes();

  // REMOVE: Local state for availableTownships
  // const [availableTownships, setAvailableTownships] = useState<Array<{short: string, name: string}>>([]);

  // ... rest of existing state ...
}
```

#### Step 3: Remove getTownshipsForState Function
```typescript
// REMOVE this entire function - no longer needed
// const getTownshipsForState = (stateCode: string): Array<{short: string, name: string}> => { ... }
```

#### Step 4: Update useEffect for External Value
```typescript
// UPDATE the useEffect that handles external value changes
useEffect(() => {
  if (value) {
    setFreeFormValue(value);
    const newParts = parseNrc(value);
    if (!newParts.state && !newParts.township && !newParts.citizenship && !newParts.serial) {
      if (externalIsFreeForm === undefined) {
        setInternalIsFreeForm(true);
      }
    } else {
      setParts(newParts);
      // REMOVE: setAvailableTownships(getTownshipsForState(newParts.state));
      // Townships will be loaded automatically by the hook

      if (isGuardianMirrored && newParts.state && newParts.township && newParts.citizenship && newParts.serial) {
        setIsManuallyCompleted(true);
      }
    }
  }
}, [value, isGuardianMirrored, fieldName]);
```

#### Step 5: Remove Township Update useEffect
```typescript
// REMOVE this entire useEffect - townships are now handled by the hook
// useEffect(() => {
//   if (parts.state) {
//     const townships = getTownshipsForState(parts.state);
//     setAvailableTownships(townships);
//     ...
//   }
// }, [parts.state]);
```

#### Step 6: Update Validation Logic
```typescript
// UPDATE validateNrc and related functions to handle async township data
// Add check for township loading state before validation
const isDataComplete = completionProgress === 100 && formattedValue && !hasErrors && !townshipsLoading;
```

#### Step 7: Update Render - States Dropdown
```typescript
<SelectContent>
  {statesLoading ? (
    <SelectItem value="" disabled>Loading...</SelectItem>
  ) : (
    states?.map((state) => (
      <SelectItem key={state.id} value={state.number.en}>
        <div className="flex items-center gap-2">
          <span className="font-mono">{state.number.en}</span>
          <span className="text-xs">
            {currentLanguage === "mm" ? state.name.mm : state.name.en}
          </span>
        </div>
      </SelectItem>
    ))
  )}
</SelectContent>
```

#### Step 8: Update Render - Townships Dropdown
```typescript
<SelectContent>
  {townshipsLoading ? (
    <SelectItem value="" disabled>Loading...</SelectItem>
  ) : (
    townships?.map((township) => (
      <SelectItem key={township.id} value={township.short.en}>
        <div className="flex items-center gap-2">
          <span className="font-mono">{township.short.en}</span>
          <span className="text-xs text-muted-foreground">{township.name.en}</span>
        </div>
      </SelectItem>
    ))
  )}
</SelectContent>
```

#### Step 9: Update Render - Citizenship Types Dropdown
```typescript
<SelectContent>
  {typesLoading ? (
    <SelectItem value="" disabled>Loading...</SelectItem>
  ) : (
    types?.map((type) => (
      <SelectItem key={type.id} value={type.name.en}>
        <div className="flex items-center gap-2">
          <span className="font-mono">{type.name.en}</span>
          <span className="text-xs">
            {currentLanguage === "mm" ? type.name.mm : type.description.en}
          </span>
        </div>
      </SelectItem>
    ))
  )}
</SelectContent>
```

---

### 2. **PublicWeb PublicNrcField** (`apps/publicWeb/.../PublicNrcField.tsx`)

Similar changes as Core App, but simpler component structure.

#### Update Imports
```typescript
// REMOVE:
import nrcData from "@/../../NRC_Data.json";

// ADD:
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";
```

#### Add Hooks
```typescript
export function PublicNrcField({ value = "", onChange, error, disabled = false }: NrcFieldProps) {
  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));

  // ADD: Lazy load data
  const { states } = useNrcStates();
  const { townships } = useNrcTownships(parts.stateNumber);
  const { types } = useNrcTypes();

  // REMOVE: const [availableTownships, setAvailableTownships] = useState<any[]>([]);
```

#### Update Render
```typescript
// States
{states?.map((state) => (
  <SelectItem key={state.id} value={state.number.en}>
    {state.number.en} - {state.name.en}
  </SelectItem>
))}

// Townships
{townships?.map((township) => (
  <SelectItem key={township.id} value={township.short.en}>
    {township.short.en} - {township.name.en}
  </SelectItem>
))}

// Types
{types?.map((type) => (
  <SelectItem key={type.id} value={type.name.en}>
    {type.name.en}
  </SelectItem>
))}
```

---

### 3. **PublicWeb CompactNrcField** (`apps/publicWeb/.../CompactNrcField.tsx`)

#### Remove Hardcoded Data
```typescript
// REMOVE: const MYANMAR_STATES = [ ... ];
// REMOVE: const CITIZENSHIP_TYPES = [ ... ];
// REMOVE: const getTownshipsForState = () => { ... };
```

#### Add Hooks
```typescript
const { states } = useNrcStates();
const { townships } = useNrcTownships(parts.state);
const { types } = useNrcTypes();
```

#### Update Render
Similar to PublicNrcField above.

---

## Migration Checklist

- [ ] Install `swr` package if not already installed
- [ ] Add `@repo/nrc-hooks` to package.json dependencies
- [ ] Update `libs/schema-forms/NrcField.tsx`
- [ ] Update `apps/publicWeb/.../PublicNrcField.tsx`
- [ ] Update `apps/publicWeb/.../CompactNrcField.tsx`
- [ ] Test state dropdown loads correctly
- [ ] Test township dropdown lazy loads when state selected
- [ ] Test form validation works with async data
- [ ] Test guardian mirroring still works
- [ ] Test free-form toggle functionality
- [ ] Verify performance improvement (check Network tab)

---

## Expected Performance Improvement

### Before (Old Approach)
- Initial load: **131 KB** (all data loaded upfront)
- Total requests: **1**
- Time to interactive: ~500ms

### After (Lazy Loading)
- Initial load: **~3.5 KB** (states + types only)
- Township load (on demand): **1-24 KB** per state
- Total requests: **2-3** (states, types, townships when selected)
- Time to interactive: ~100ms
- **Bandwidth savings: ~92-97%**

---

## Testing

### Manual Testing
1. Open student registration form
2. Check Network tab - should only see `/api/nrc/states` and `/api/nrc/types`
3. Select a state (e.g., "1 - KACHIN")
4. Check Network tab - should see `/api/nrc/townships/1`
5. Verify townships load correctly
6. Test form submission works

### Automated Testing (Future)
```typescript
// Example test
it('should lazy load townships when state is selected', async () => {
  render(<NrcField value="" onChange={mockOnChange} />);

  // Initially, no townships request
  expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('/townships/'));

  // Select state
  fireEvent.change(screen.getByRole('combobox', { name: /state/i }), {
    target: { value: '1' }
  });

  // Should fetch townships for state 1
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/nrc/townships/1');
  });
});
```

---

## Rollback Plan

If issues occur, rollback is simple:

1. Revert component imports back to `import nrcData from "..."`
2. Restore removed functions (getTownshipsForState, etc.)
3. Restore useEffect hooks that were removed
4. Keep the new data files - they don't break anything

The old `NRC_Data.json` can be recreated from `NRC_Data_New.json` if needed.

---

**Last Updated**: 2025-11-07
**Version**: 1.0
