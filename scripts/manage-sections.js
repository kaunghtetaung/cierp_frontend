#!/usr/bin/env node

/**
 * MongoDB Section Management Script
 *
 * This script helps manage sections and pages for production tenants
 * Usage: node scripts/manage-sections.js [command]
 *
 * Commands:
 *   list-sections    - List all sections for the organization
 *   list-pages       - List all pages for the organization
 *   show-section <id> - Show detailed section data
 *   update-section   - Interactive section update (coming soon)
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection details
const MONGO_URL = 'mongodb://cidbaccess:cidb1234@mongo:27017';
const DB_NAME = 'cidb'; // Update if different
const ORG_ID = '68d12d98e776d47ad2004f19';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);
  return client.db(DB_NAME);
}

/**
 * Format multi-language text for display
 */
function formatMLText(mlText) {
  if (!mlText) return 'N/A';
  if (typeof mlText === 'string') return mlText;
  return `EN: ${mlText.en || 'N/A'} | MM: ${mlText.mm || 'N/A'}`;
}

/**
 * List all sections for the organization
 */
async function listSections(db) {
  const sections = await db
    .collection('sections')
    .find({ organizationId: new ObjectId(ORG_ID) })
    .sort({ order: 1 })
    .toArray();

  console.log(`${colors.bright}${colors.blue}Sections for Organization ${ORG_ID}:${colors.reset}\n`);
  console.log(`${colors.cyan}Total sections: ${sections.length}${colors.reset}\n`);

  sections.forEach((section, index) => {
    const status = section.isEnabled ? `${colors.green}✓ Enabled${colors.reset}` : `${colors.red}✗ Disabled${colors.reset}`;
    console.log(`${colors.bright}${index + 1}. ${section.name}${colors.reset}`);
    console.log(`   ID: ${section._id}`);
    console.log(`   Type: ${colors.yellow}${section.type}${colors.reset}`);
    console.log(`   Order: ${section.order}`);
    console.log(`   Status: ${status}`);
    console.log(`   Title: ${formatMLText(section.title)}`);
    console.log('');
  });

  return sections;
}

/**
 * List all pages for the organization
 */
async function listPages(db) {
  const pages = await db
    .collection('pages')
    .find({ organizationId: new ObjectId(ORG_ID) })
    .sort({ order: 1 })
    .toArray();

  console.log(`${colors.bright}${colors.blue}Pages for Organization ${ORG_ID}:${colors.reset}\n`);
  console.log(`${colors.cyan}Total pages: ${pages.length}${colors.reset}\n`);

  pages.forEach((page, index) => {
    const status = page.isActive ? `${colors.green}✓ Active${colors.reset}` : `${colors.red}✗ Inactive${colors.reset}`;
    console.log(`${colors.bright}${index + 1}. ${page.name}${colors.reset}`);
    console.log(`   ID: ${page._id}`);
    console.log(`   Slug: ${colors.yellow}${page.slug}${colors.reset}`);
    console.log(`   Template: ${page.template || 'N/A'}`);
    console.log(`   Status: ${status}`);
    console.log(`   Title: ${formatMLText(page.title)}`);
    console.log(`   Sections: ${page.sections?.length || 0} attached`);
    console.log('');
  });

  return pages;
}

/**
 * Show detailed section information
 */
async function showSection(db, sectionId) {
  const section = await db.collection('sections').findOne({ _id: new ObjectId(sectionId) });

  if (!section) {
    console.log(`${colors.red}✗ Section not found: ${sectionId}${colors.reset}`);
    return null;
  }

  console.log(`${colors.bright}${colors.blue}Section Details:${colors.reset}\n`);
  console.log(JSON.stringify(section, null, 2));
  console.log('');

  return section;
}

/**
 * Show section type examples
 */
function showExamples() {
  console.log(`${colors.bright}${colors.blue}Available Section Types:${colors.reset}\n`);

  const examples = [
    { type: 'hero', desc: 'Main banner with background image/video' },
    { type: 'contentWithImage', desc: 'Content blocks with images (left/right)' },
    { type: 'featureList', desc: 'Features in grid/list/carousel' },
    { type: 'cta', desc: 'Call-to-action buttons with backgrounds' },
    { type: 'gallery', desc: 'Image galleries (grid/masonry/carousel)' },
    { type: 'testimonials', desc: 'Customer testimonials' },
    { type: 'faq', desc: 'Question/answer sections' },
    { type: 'pricing', desc: 'Pricing plans' },
    { type: 'dataTable', desc: 'Tabular data display' },
    { type: 'organizationStructure', desc: 'Org chart/hierarchy' },
  ];

  examples.forEach((ex, i) => {
    console.log(`${colors.bright}${i + 1}. ${colors.yellow}${ex.type}${colors.reset}`);
    console.log(`   ${ex.desc}\n`);
  });
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'help';
  const arg = process.argv[3];

  let db, client;

  try {
    if (command === 'help') {
      console.log(`${colors.bright}${colors.blue}MongoDB Section Management${colors.reset}\n`);
      console.log('Usage: node scripts/manage-sections.js [command]\n');
      console.log('Commands:');
      console.log(`  ${colors.green}list-sections${colors.reset}     - List all sections`);
      console.log(`  ${colors.green}list-pages${colors.reset}        - List all pages`);
      console.log(`  ${colors.green}show-section <id>${colors.reset} - Show detailed section data`);
      console.log(`  ${colors.green}examples${colors.reset}          - Show section type examples`);
      console.log('');
      return;
    }

    if (command === 'examples') {
      showExamples();
      return;
    }

    // Commands that need DB connection
    const mongoClient = new MongoClient(MONGO_URL);
    client = mongoClient;
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    switch (command) {
      case 'list-sections':
        await listSections(db);
        break;

      case 'list-pages':
        await listPages(db);
        break;

      case 'show-section':
        if (!arg) {
          console.log(`${colors.red}✗ Please provide section ID${colors.reset}`);
          console.log(`Usage: node scripts/manage-sections.js show-section <id>`);
          return;
        }
        await showSection(db, arg);
        break;

      default:
        console.log(`${colors.red}✗ Unknown command: ${command}${colors.reset}`);
        console.log(`Run 'node scripts/manage-sections.js help' for usage`);
    }
  } catch (error) {
    console.error(`${colors.red}✗ Error:${colors.reset}`, error.message);
    console.error(error);
  } finally {
    if (client) {
      await client.close();
      console.log(`${colors.green}✓ Disconnected from MongoDB${colors.reset}`);
    }
  }
}

// Run main if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { connectDB, listSections, listPages, showSection };
