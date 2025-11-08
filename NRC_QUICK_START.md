# 🚀 NRC Lazy Loading - Quick Start Guide

## ✅ What's Done

All infrastructure is complete:
- ✅ Data consolidated with human-readable IDs (1-001, 1-002, etc.)
- ✅ Data split for lazy loading (~3KB initial vs 131KB)
- ✅ API routes created for both apps
- ✅ React hooks library ready
- ✅ TypeScript types defined

## 📋 What You Need to Do

### Step 1: Install Dependencies (2 minutes)

```bash
# Install SWR for data fetching
pnpm add swr

# Add nrc-hooks to your apps
cd apps/publicWeb
pnpm add @repo/nrc-hooks

cd ../core
pnpm add @repo/nrc-hooks
```

### Step 2: Update Components (30-45 minutes)

Open [NRC_COMPONENT_UPDATE_GUIDE.md](NRC_COMPONENT_UPDATE_GUIDE.md) and follow the step-by-step instructions for each component:

1. **Core App**: `libs/schema-forms/NrcField.tsx`
2. **PublicWeb**: `apps/publicWeb/.../PublicNrcField.tsx`
3. **PublicWeb**: `apps/publicWeb/.../CompactNrcField.tsx`

### Step 3: Test (10 minutes)

```bash
# Start dev server
npm run dev

# Test in browser:
# 1. Open student registration
# 2. Open Network tab (F12)
# 3. Should see only /api/nrc/states and /api/nrc/types
# 4. Select a state
# 5. Should see /api/nrc/townships/{stateId}
# 6. Verify townships load correctly
```

## 📊 Expected Results

### Before Migration
```
Network Tab:
- NRC_Data.json: 131 KB
Total: 131 KB
```

### After Migration
```
Network Tab:
- /api/nrc/states: 2.5 KB
- /api/nrc/types: 1 KB
- /api/nrc/townships/12: 12.7 KB (only when user selects state 12)
Total: ~16 KB (vs 131 KB) = 88% reduction
```

## 🎯 Quick Verification

Run this checklist after updating each component:

- [ ] Component compiles without errors
- [ ] State dropdown shows all 14 states
- [ ] Township dropdown is empty until state selected
- [ ] Selecting state loads townships for that state only
- [ ] Form submission works
- [ ] Validation works
- [ ] Loading states show (optional but nice)

## 🆘 If You Get Stuck

1. **Check API routes exist**:
   ```bash
   ls apps/publicWeb/src/app/api/nrc/
   # Should see: states/, types/, townships/
   ```

2. **Check data files exist**:
   ```bash
   ls libs/nrc-data/
   # Should see: nrc-states.json, nrc-types.json, townships/
   ```

3. **Check hooks library**:
   ```bash
   ls libs/nrc-hooks/src/
   # Should see: index.ts, types.ts, use-nrc-data.ts
   ```

4. **Review detailed guides**:
   - [NRC_COMPONENT_UPDATE_GUIDE.md](NRC_COMPONENT_UPDATE_GUIDE.md) - Detailed steps
   - [NRC_LAZY_LOADING_SUMMARY.md](NRC_LAZY_LOADING_SUMMARY.md) - Full overview

## 🎉 That's It!

Total time: ~1 hour
Performance gain: 97% reduction in initial load
Ready to ship: Yes!

Happy coding! 🚀
