# 🎯 NRC Component Migration - Final Instructions

## ✅ Everything is Ready!

- ✅ SWR installed
- ✅ Hooks library created (`@repo/nrc-hooks`)
- ✅ API routes ready (both apps)
- ✅ Data split and ready
- ✅ Backups created in `nrc-backups-*` folder

---

## 🔧 Component Updates - Copy & Paste Ready

### 1. Core App NrcField (`libs/schema-forms/NrcField.tsx`)

#### Step 1.1: Update Imports (Line 1-13)
**Find:**
```typescript
import nrcData from "../../NRC_Data.json";
```

**Replace with:**
```typescript
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";
```

#### Step 1.2: Add Hooks (After line 152, replace availableTownships state)
**Find:**
```typescript
const [availableTownships, setAvailableTownships] = useState<Array<{short: string, name: string}>>([]);
```

**Replace with:**
```typescript
// Lazy load NRC data
const { states, isLoading: statesLoading } = useNrcStates();
const { townships, isLoading: townshipsLoading } = useNrcTownships(parts.state);
const { types, isLoading: typesLoading } = useNrcTypes();
```

#### Step 1.3: Remove useEffect for townships (Lines ~201-213)
**Delete this entire useEffect:**
```typescript
// Update available townships when state changes
useEffect(() => {
  if (parts.state) {
    const townships = getTownshipsForState(parts.state);
    setAvailableTownships(townships);
    // Clear township if it's not valid for the new state (check English short codes)
    if (parts.township && !townships.some(t => t.short === parts.township)) {
      handlePartChange("township", "");
    }
  } else {
    setAvailableTownships([]);
  }
}, [parts.state]);
```

#### Step 1.4: Update States Dropdown (Line ~425)
**Find:**
```typescript
<SelectContent>
  {nrcData.nrcStates.map((state: any) => (
    <SelectItem key={state.id} value={state.number.en}>
```

**Replace with:**
```typescript
<SelectContent>
  {statesLoading ? (
    <SelectItem value="" disabled>Loading...</SelectItem>
  ) : (
    states?.map((state) => (
      <SelectItem key={state.id} value={state.number.en}>
```

**And close it properly:**
```typescript
      </SelectItem>
    ))
  )}
</SelectContent>
```

#### Step 1.5: Update Townships Dropdown (Line ~460)
**Find:**
```typescript
<SelectContent>
  {availableTownships.map((township) => (
    <SelectItem key={township.short} value={township.short}>
```

**Replace with:**
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

#### Step 1.6: Update Types Dropdown (Line ~494)
**Find:**
```typescript
<SelectContent>
  {CITIZENSHIP_TYPES.map((type) => (
```

**Replace with:**
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

### 2. PublicWeb PublicNrcField

#### Step 2.1: Update Imports
**Find:**
```typescript
import nrcData from "@/../../NRC_Data.json";
```

**Replace with:**
```typescript
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";
```

#### Step 2.2: Add Hooks (After line 54)
**Find:**
```typescript
const [availableTownships, setAvailableTownships] = useState<any[]>([]);
```

**Replace with:**
```typescript
// Lazy load NRC data
const { states } = useNrcStates();
const { townships } = useNrcTownships(parts.stateNumber);
const { types } = useNrcTypes();
```

#### Step 2.3: Remove useEffect (Lines ~66-75)
**Delete the entire useEffect that updates availableTownships**

#### Step 2.4: Update Dropdowns

**States dropdown:**
```typescript
{states?.map((state) => (
  <SelectItem key={state.id} value={state.number.en}>
    {state.number.en} - {state.name.en}
  </SelectItem>
))}
```

**Townships dropdown:**
```typescript
{townships?.map((township) => (
  <SelectItem key={township.id} value={township.short.en}>
    {township.short.en} - {township.name.en}
  </SelectItem>
))}
```

**Types dropdown:**
```typescript
{types?.map((type) => (
  <SelectItem key={type.id} value={type.name.en}>
    {type.name.en}
  </SelectItem>
))}
```

---

### 3. PublicWeb CompactNrcField

#### Step 3.1: Remove Hardcoded Data (Lines ~9-37)
**Delete these constants:**
- `const MYANMAR_STATES`
- `const CITIZENSHIP_TYPES`
- `const getTownshipsForState`

#### Step 3.2: Add Import
```typescript
import { useNrcStates, useNrcTownships, useNrcTypes } from "@repo/nrc-hooks";
```

#### Step 3.3: Add Hooks (After line 94)
```typescript
// Lazy load NRC data
const { states } = useNrcStates();
const { townships } = useNrcTownships(parts.state);
const { types } = useNrcTypes();
```

#### Step 3.4: Remove useEffect (Lines ~111-121)
**Delete the useEffect that manages availableTownships**

#### Step 3.5: Update Dropdowns

**States:**
```typescript
{states?.map((state) => (
  <SelectItem key={state.id} value={state.number.en}>
    <span className="font-mono text-xs">{state.number.en} - {state.name.en}</span>
  </SelectItem>
))}
```

**Townships:**
```typescript
{townships?.map((township) => (
  <SelectItem key={township.id} value={township.short.en}>
    <span className="font-mono text-xs">{township.short.en}</span>
  </SelectItem>
))}
```

**Types:**
```typescript
{types?.map((type) => (
  <SelectItem key={type.id} value={type.name.en}>
    <span className="font-mono text-xs">{type.name.en} - {type.description.en}</span>
  </SelectItem>
))}
```

---

## ✅ Testing Checklist

After each component update:

1. **Compile Check**
   ```bash
   pnpm run type-check
   ```

2. **Dev Server**
   ```bash
   npm run dev
   ```

3. **Browser Test**
   - Open student registration form
   - F12 → Network tab
   - Check: Only 3.5 KB loaded initially (states + types)
   - Select a state
   - Check: Townships load for that state only (~5-20 KB)
   - Complete form
   - Check: Form submits successfully

4. **Functionality Test**
   - [ ] States dropdown shows 14 options
   - [ ] Townships dropdown empty until state selected
   - [ ] Selecting state populates townships
   - [ ] Form validation works
   - [ ] Free-form toggle works (if applicable)
   - [ ] Guardian mirroring works (if applicable)

---

## 🎯 Quick Summary

### What Changed:
1. ❌ **Removed**: `import nrcData from "..."`
2. ✅ **Added**: `import { useNrcStates, ... } from "@repo/nrc-hooks"`
3. ✅ **Added**: Hooks for lazy loading
4. ❌ **Removed**: Manual useEffect for filtering
5. ✅ **Updated**: Dropdowns to use hook data
6. ✅ **Added**: Loading states (optional but nice)

### Performance Gain:
- Before: 131 KB loaded upfront
- After: 3.5 KB initially, 5-20 KB when state selected
- **Savings: 85-97%**

---

## 🆘 Need Help?

If you get stuck, check:
1. **Compilation errors**: Make sure imports are correct
2. **Network errors**: Verify API routes exist
3. **No data showing**: Check browser console for errors
4. **Backups**: Your originals are in `nrc-backups-*` folder

Or refer to the detailed guide: [NRC_COMPONENT_UPDATE_GUIDE.md](NRC_COMPONENT_UPDATE_GUIDE.md)

---

**Ready to update?** Start with one component, test it, then move to the next! 🚀
