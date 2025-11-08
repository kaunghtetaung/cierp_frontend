#!/usr/bin/env node

/**
 * NRC Data Consolidation Script
 *
 * This script consolidates multiple NRC JSON files (1.json, 2.json, ..., 14.json)
 * into a single consolidated format that matches the old NRC_Data.json structure.
 *
 * Usage: node scripts/consolidate-nrc-data.js
 */

const fs = require('fs');
const path = require('path');

// State/Region mapping with codes
// Using file name as state ID for human readability
const STATE_MAPPING = {
  '1': { code: 'KACHIN', name: { en: 'KACHIN', mm: 'ကချင်' } },
  '2': { code: 'KAYAH', name: { en: 'KAYAH', mm: 'ကယား' } },
  '3': { code: 'KAYIN', name: { en: 'KAYIN', mm: 'ကရင်' } },
  '4': { code: 'CHIN', name: { en: 'CHIN', mm: 'ချင်း' } },
  '5': { code: 'SAGAING', name: { en: 'SAGAING', mm: 'စစ်ကိုင်း' } },
  '6': { code: 'TANINTHARYI', name: { en: 'TANINTHARYI', mm: 'တနသာရီ' } },
  '7': { code: 'BAGO', name: { en: 'BAGO', mm: 'ပဲခူး' } },
  '8': { code: 'MAGWAY', name: { en: 'MAGWAY', mm: 'မကွေး' } },
  '9': { code: 'MANDALAY', name: { en: 'MANDALAY', mm: 'မန္တလေး' } },
  '10': { code: 'MON', name: { en: 'MON', mm: 'မွန်' } },
  '11': { code: 'RAKHINE', name: { en: 'RAKHINE', mm: 'ရခိုင်' } },
  '12': { code: 'YANGON', name: { en: 'YANGON', mm: 'ရန်ကုန်' } },
  '13': { code: 'SHAN', name: { en: 'SHAN', mm: 'ရှမ်း' } },
  '14': { code: 'AYEYARWADY', name: { en: 'AYEYARWADY', mm: 'ဧရာဝတီ' } }
};

// Citizenship types - Using letter codes as IDs for simplicity
const NRC_TYPES = [
  { id: 'N', name: { en: 'N', mm: 'နိုင်' }, description: { en: 'Citizen', mm: 'နိုင်ငံသား' } },
  { id: 'E', name: { en: 'E', mm: 'ဧည့်' }, description: { en: 'Associate Citizen', mm: 'ဧည့်နိုင်ငံသား' } },
  { id: 'P', name: { en: 'P', mm: 'ပြု' }, description: { en: 'Naturalized Citizen', mm: 'နိုင်ငံသားပြု' } },
  { id: 'T', name: { en: 'T', mm: 'သာသနာ' }, description: { en: 'Temporary', mm: 'သာသနာ' } },
  { id: 'Y', name: { en: 'Y', mm: 'ယာယီ' }, description: { en: 'Provisional', mm: 'ယာယီ' } },
  { id: 'S', name: { en: 'S', mm: 'စ' }, description: { en: 'Special', mm: 'စ' } }
];

// Myanmar number to English number conversion
const myanmarToEnglish = (mmNum) => {
  const mmDigits = '၀၁၂၃၄၅၆၇၈၉';
  const enDigits = '0123456789';
  let result = '';
  for (let char of mmNum) {
    const index = mmDigits.indexOf(char);
    result += index !== -1 ? enDigits[index] : char;
  }
  return result;
};

// English number to Myanmar number conversion
const englishToMyanmar = (enNum) => {
  const mmDigits = '၀၁၂၃၄၅၆၇၈၉';
  const enDigits = '0123456789';
  let result = '';
  for (let char of String(enNum)) {
    const index = enDigits.indexOf(char);
    result += index !== -1 ? mmDigits[index] : char;
  }
  return result;
};

// Generate human-readable township ID with padding
// Format: stateId-townshipNumber (e.g., "1-001", "1-002", "14-034")
function generateTownshipId(stateId, townshipIndex) {
  // Pad township number to 3 digits for consistent sorting
  const paddedIndex = String(townshipIndex).padStart(3, '0');
  return `${stateId}-${paddedIndex}`;
}

async function consolidateNrcData() {
  console.log('🚀 Starting NRC data consolidation...\n');

  const nrcDir = path.join(__dirname, '..', 'NRC');
  const outputFile = path.join(__dirname, '..', 'NRC_Data_New.json');

  // Check if NRC directory exists
  if (!fs.existsSync(nrcDir)) {
    console.error('❌ Error: NRC directory not found at', nrcDir);
    process.exit(1);
  }

  // Initialize consolidated data structure
  const consolidatedData = {
    nrcTypes: NRC_TYPES,
    nrcStates: [],
    nrcTownships: []
  };

  // Build states array - using file name as ID (human readable)
  for (let i = 1; i <= 14; i++) {
    const stateCode = String(i);
    const stateInfo = STATE_MAPPING[stateCode];

    consolidatedData.nrcStates.push({
      id: stateCode,  // Human-readable: "1", "2", ... "14"
      code: stateInfo.code,
      number: {
        en: stateCode,
        mm: englishToMyanmar(stateCode)
      },
      name: stateInfo.name
    });
  }

  // Process each NRC file
  let totalTownships = 0;
  let processedStates = 0;

  for (let i = 1; i <= 14; i++) {
    const stateCode = String(i);
    const filePath = path.join(nrcDir, `${i}.json`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Warning: File ${i}.json not found, skipping...`);
      continue;
    }

    console.log(`📄 Processing state ${stateCode} (${STATE_MAPPING[stateCode].name.en})...`);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      if (!jsonData.nrc_code || !Array.isArray(jsonData.nrc_code)) {
        console.warn(`⚠️  Warning: Invalid data structure in ${i}.json, skipping...`);
        continue;
      }

      const townships = jsonData.nrc_code;
      const stateInfo = STATE_MAPPING[stateCode];

      townships.forEach((township, index) => {
        // Generate human-readable ID: stateId-townshipNumber (padded)
        // e.g., "1-001", "1-002", ... "1-030" for State 1
        const townshipId = generateTownshipId(stateCode, index + 1);

        consolidatedData.nrcTownships.push({
          id: townshipId,  // Human-readable: "1-001", "1-002", etc.
          stateId: stateCode,  // Human-readable state ID: "1", "2", etc.
          name: {
            en: township.Township_Name || '',  // Myanmar name as primary
            mm: township.Township_Name || ''
          },
          short: {
            en: township.NRC_Code || '',  // Myanmar short code
            mm: township.NRC_Code || ''
          },
          townshipCode: township.Township_Code || null,
          originalId: township.ID
        });

        totalTownships++;
      });

      processedStates++;
      console.log(`   ✓ Processed ${townships.length} townships`);

    } catch (error) {
      console.error(`❌ Error processing ${i}.json:`, error.message);
      continue;
    }
  }

  // Write consolidated data to file
  try {
    fs.writeFileSync(
      outputFile,
      JSON.stringify(consolidatedData, null, 2),
      'utf8'
    );

    console.log('\n✅ Consolidation complete!');
    console.log(`📊 Summary:`);
    console.log(`   - States processed: ${processedStates}/14`);
    console.log(`   - Total townships: ${totalTownships}`);
    console.log(`   - Output file: ${path.relative(process.cwd(), outputFile)}`);
    console.log(`   - File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error writing output file:', error.message);
    process.exit(1);
  }
}

// Run the consolidation
consolidateNrcData().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
