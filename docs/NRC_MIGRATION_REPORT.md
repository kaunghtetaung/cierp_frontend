# NRC Data Migration Report

## Summary

Successfully consolidated 14 separate NRC JSON files into a single unified format that matches the old `NRC_Data.json` structure while preserving the Myanmar-language data from the new source.

## Data Statistics

- **Total States/Regions**: 14
- **Total Townships**: 430
- **Output File**: `NRC_Data_New.json`
- **File Size**: 143.67 KB

### Townships by State:
1. **KACHIN (၁)**: 30 townships
2. **KAYAH (၂)**: 8 townships
3. **KAYIN (၃)**: 17 townships
4. **CHIN (၄)**: 13 townships
5. **SAGAING (၅)**: 47 townships
6. **TANINTHARYI (၆)**: 18 townships
7. **BAGO (၇)**: 28 townships
8. **MAGWAY (၈)**: 27 townships
9. **MANDALAY (၉)**: 43 townships
10. **MON (၁၀)**: 12 townships
11. **RAKHINE (၁၁)**: 20 townships
12. **YANGON (၁၂)**: 46 townships
13. **SHAN (၁၃)**: 87 townships
14. **AYEYARWADY (၁၄)**: 34 townships

## Data Structure Comparison

### Old Format (`NRC_Data.json`)
```json
{
  "nrcTypes": [...],
  "nrcStates": [
    {
      "id": "bTuNIfLfchNvk1N_",
      "code": "KACHIN",
      "number": { "en": "1", "mm": "၁" },
      "name": { "en": "KACHIN", "mm": "ကချင်" }
    }
  ],
  "nrcTownships": [
    {
      "id": "...",
      "stateId": "bTuNIfLfchNvk1N_",
      "name": { "en": "Bhamo", "mm": "ဗန်းမော်" },
      "short": { "en": "BaMaNa", "mm": "ဗမန" }  // English codes
    }
  ]
}
```

### New Format (`NRC_Data_New.json`)
```json
{
  "nrcTypes": [...],  // Same structure
  "nrcStates": [...],  // Same structure
  "nrcTownships": [
    {
      "id": "nrc_k3k4ce4nnmhozhsn7",
      "stateId": "bTuNIfLfchNvk1N_",
      "name": {
        "en": "ကန်ပိုက်တီး(ခွဲ)",  // Myanmar names
        "mm": "ကန်ပိုက်တီး(ခွဲ)"
      },
      "short": {
        "en": "ကပတ",  // Myanmar short codes
        "mm": "ကပတ"
      },
      "townshipCode": null,  // Township code (ts0063 format)
      "originalId": 243  // Original ID from source file
    }
  ]
}
```

## Key Differences

### 1. **Township Short Codes**
- **Old**: English transliteration (e.g., `BaMaNa`, `OuKaMa`)
- **New**: Myanmar script (e.g., `ဗမန`, `ကပတ`)

### 2. **Township Names**
- **Old**: Mixed English/Myanmar names
- **New**: Primarily Myanmar script names

### 3. **Additional Fields**
- **New**: `townshipCode` field (township code in ts#### format)
- **New**: `originalId` field (preserves original database ID)

## Migration Impact

### Components Affected:

1. **Core App**: `libs/schema-forms/NrcField.tsx`
   - Currently imports from `../../NRC_Data.json`
   - Uses English township codes (OuKaMa format)
   - Format: `12/OuKaMa(N)123456`

2. **PublicWeb**: `apps/publicWeb/.../PublicNrcField.tsx`
   - Currently imports from `@/../../NRC_Data.json`
   - Uses English township codes
   - Same format as core app

3. **PublicWeb**: `apps/publicWeb/.../CompactNrcField.tsx`
   - Uses **hardcoded** state/township data
   - Less accurate than centralized data
   - Needs complete replacement

## Next Steps

### Option A: Keep English Format (Recommended for Backward Compatibility)
1. Create mapping utility to convert Myanmar codes → English codes
2. Update components to use new data source with conversion layer
3. Maintain `12/OuKaMa(N)123456` format in database

### Option B: Switch to Myanmar Format (Full Migration)
1. Update all components to use Myanmar codes
2. Change format to `၁၂/ကပတ(နိုင်)၁၂၃၄၅၆`
3. Migrate existing NRC data in database
4. Update validation logic

### Option C: Hybrid Approach (Flexible)
1. Support both formats in components
2. Allow users to toggle between English/Myanmar
3. Store in database with format indicator
4. Convert between formats as needed

## Recommendation

**Proceed with Option A** initially:
- Maintains backward compatibility
- No database migration needed
- Can add Myanmar format support later
- Lower risk of breaking existing functionality

## Files Created

1. **Script**: `scripts/consolidate-nrc-data.js`
   - Consolidates 14 JSON files into single format
   - Generates unique IDs for townships
   - Preserves original data structure

2. **Output**: `NRC_Data_New.json`
   - Consolidated data file
   - Ready to replace old format
   - Contains all 430 townships

## Validation Checklist

- [x] All 14 state files processed successfully
- [x] Total township count: 430
- [x] Data structure matches old format
- [x] State IDs preserved for compatibility
- [x] Myanmar script preserved in new data
- [ ] Components updated to use new data
- [ ] Tests added for data validation
- [ ] Backward compatibility verified
- [ ] Database migration plan (if needed)

---

**Generated**: 2025-11-07
**Script**: `scripts/consolidate-nrc-data.js`
