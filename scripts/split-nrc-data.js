#!/usr/bin/env node

/**
 * NRC Data Splitter Script
 *
 * This script splits NRC_Data_New.json into smaller files for lazy loading:
 * - nrc-types.json (citizenship types)
 * - nrc-states.json (14 states/regions)
 * - townships/1.json through townships/14.json (townships by state)
 *
 * Usage: node scripts/split-nrc-data.js
 */

const fs = require('fs');
const path = require('path');

async function splitNrcData() {
  console.log('🚀 Starting NRC data splitting for lazy loading...\n');

  const sourceFile = path.join(__dirname, '..', 'NRC_Data_New.json');
  const outputDir = path.join(__dirname, '..', 'libs', 'nrc-data');
  const townshipsDir = path.join(outputDir, 'townships');

  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error('❌ Error: NRC_Data_New.json not found at', sourceFile);
    console.error('   Please run consolidate-nrc-data.js first');
    process.exit(1);
  }

  // Create output directories
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('✓ Created directory:', outputDir);
  }

  if (!fs.existsSync(townshipsDir)) {
    fs.mkdirSync(townshipsDir, { recursive: true });
    console.log('✓ Created directory:', townshipsDir);
  }

  // Read source data
  console.log('📖 Reading source file...');
  const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

  // 1. Write NRC Types
  console.log('\n📄 Splitting NRC types...');
  const typesFile = path.join(outputDir, 'nrc-types.json');
  fs.writeFileSync(
    typesFile,
    JSON.stringify(sourceData.nrcTypes, null, 2),
    'utf8'
  );
  const typesSize = (fs.statSync(typesFile).size / 1024).toFixed(2);
  console.log(`   ✓ Created nrc-types.json (${typesSize} KB)`);

  // 2. Write NRC States
  console.log('\n📄 Splitting NRC states...');
  const statesFile = path.join(outputDir, 'nrc-states.json');
  fs.writeFileSync(
    statesFile,
    JSON.stringify(sourceData.nrcStates, null, 2),
    'utf8'
  );
  const statesSize = (fs.statSync(statesFile).size / 1024).toFixed(2);
  console.log(`   ✓ Created nrc-states.json (${statesSize} KB)`);

  // 3. Write Townships by State
  console.log('\n📄 Splitting townships by state...');

  const townshipsByState = {};
  let totalTownships = 0;

  // Group townships by state
  sourceData.nrcTownships.forEach(township => {
    const stateId = township.stateId;
    if (!townshipsByState[stateId]) {
      townshipsByState[stateId] = [];
    }
    townshipsByState[stateId].push(township);
    totalTownships++;
  });

  // Write individual state files
  const stateStats = [];
  Object.keys(townshipsByState).sort((a, b) => parseInt(a) - parseInt(b)).forEach(stateId => {
    const townships = townshipsByState[stateId];
    const townshipFile = path.join(townshipsDir, `${stateId}.json`);

    fs.writeFileSync(
      townshipFile,
      JSON.stringify(townships, null, 2),
      'utf8'
    );

    const fileSize = (fs.statSync(townshipFile).size / 1024).toFixed(2);
    const stateName = sourceData.nrcStates.find(s => s.id === stateId)?.name.en || stateId;

    console.log(`   ✓ State ${stateId.padEnd(2)} (${stateName.padEnd(12)}): ${String(townships.length).padStart(2)} townships → ${fileSize.padStart(6)} KB`);

    stateStats.push({
      stateId,
      stateName,
      townshipCount: townships.length,
      fileSize
    });
  });

  // Calculate total sizes
  const totalSizeBefore = (fs.statSync(sourceFile).size / 1024).toFixed(2);
  const totalSizeAfter = (
    parseFloat(typesSize) +
    parseFloat(statesSize) +
    stateStats.reduce((sum, s) => sum + parseFloat(s.fileSize), 0)
  ).toFixed(2);

  // Summary
  console.log('\n✅ Data splitting complete!');
  console.log('\n📊 Summary:');
  console.log(`   - NRC Types: 1 file (${typesSize} KB)`);
  console.log(`   - NRC States: 1 file (${statesSize} KB)`);
  console.log(`   - Townships: 14 files (${stateStats.reduce((s, st) => s + parseFloat(st.fileSize), 0).toFixed(2)} KB)`);
  console.log(`   - Total townships: ${totalTownships}`);
  console.log(`\n💾 File Size Comparison:`);
  console.log(`   - Original file: ${totalSizeBefore} KB`);
  console.log(`   - Split files: ${totalSizeAfter} KB`);
  console.log(`   - Difference: ${(totalSizeAfter - totalSizeBefore).toFixed(2)} KB (formatting overhead)`);

  // Create package.json for the library
  console.log('\n📦 Creating package.json for nrc-data library...');
  const packageJson = {
    name: '@repo/nrc-data',
    version: '1.0.0',
    description: 'Myanmar NRC (National Registration Card) data - split for lazy loading',
    main: 'index.js',
    types: 'index.d.ts',
    exports: {
      './types': './nrc-types.json',
      './states': './nrc-states.json',
      './townships/*': './townships/*.json'
    },
    keywords: ['nrc', 'myanmar', 'national-registration', 'data'],
    author: '',
    license: 'ISC'
  };

  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  console.log('   ✓ Created package.json');

  // Create index file for TypeScript types
  console.log('\n📝 Creating TypeScript definitions...');
  const indexDts = `// NRC Data Types

export interface NrcType {
  id: string;
  name: {
    en: string;
    mm: string;
  };
  description: {
    en: string;
    mm: string;
  };
}

export interface NrcState {
  id: string;
  code: string;
  number: {
    en: string;
    mm: string;
  };
  name: {
    en: string;
    mm: string;
  };
}

export interface NrcTownship {
  id: string;
  stateId: string;
  name: {
    en: string;
    mm: string;
  };
  short: {
    en: string;
    mm: string;
  };
  townshipCode: string | null;
  originalId: number;
}

export declare const nrcTypes: NrcType[];
export declare const nrcStates: NrcState[];
`;

  fs.writeFileSync(
    path.join(outputDir, 'index.d.ts'),
    indexDts,
    'utf8'
  );
  console.log('   ✓ Created index.d.ts');

  console.log('\n✨ All files created successfully!');
  console.log('\n📁 Output structure:');
  console.log('   libs/nrc-data/');
  console.log('   ├── package.json');
  console.log('   ├── index.d.ts');
  console.log('   ├── nrc-types.json (~0.6 KB)');
  console.log('   ├── nrc-states.json (~2 KB)');
  console.log('   └── townships/');
  console.log('       ├── 1.json (30 townships)');
  console.log('       ├── 2.json (8 townships)');
  console.log('       ├── ...');
  console.log('       └── 14.json (34 townships)');

  console.log('\n🎯 Next steps:');
  console.log('   1. Create API routes in apps/publicWeb and apps/core');
  console.log('   2. Create React hooks for lazy loading');
  console.log('   3. Update NrcField components to use hooks');
}

// Run the splitter
splitNrcData().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
