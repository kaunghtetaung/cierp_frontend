#!/usr/bin/env node

/**
 * UM1 Section Update Script
 *
 * Update University of Medicine (1) Yangon production sections
 *
 * Usage:
 *   node scripts/update-um1-sections.js list                    # List current sections
 *   node scripts/update-um1-sections.js show <section-name>     # Show specific section
 *   node scripts/update-um1-sections.js update <section-name>   # Update section (interactive)
 */

const { execSync } = require('child_process');

// Configuration
const MONGO_CMD = `docker exec ciapp-mongo mongosh -u cidbaccess -p cidb1234 --authenticationDatabase admin ciapp --quiet`;
const ORG_ID = '68d12d98e776d47ad2004f19'; // um1
const PAGE_SLUG = 'home';

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Execute MongoDB command
 */
function mongoExec(jsCode) {
  const cmd = `${MONGO_CMD} --eval "${jsCode.replace(/"/g, '\\"')}"`;
  return execSync(cmd, { encoding: 'utf-8' });
}

/**
 * List all sections
 */
function listSections() {
  console.log(`${c.bright}${c.blue}UM1 Home Page Sections:${c.reset}\n`);

  const output = mongoExec(`
    const page = db.pages.findOne(
      {organizationId: ObjectId('${ORG_ID}'), slug: '${PAGE_SLUG}'}
    );
    page.sections.forEach((s, i) => {
      const status = s.isEnabled ? '✓' : '✗';
      print(i + 1 + '. [' + status + '] ' + s.name);
      print('   Type: ' + s.type + ' | Order: ' + s.order);
      print('   EN: ' + (s.title?.en || 'N/A'));
      print('   MM: ' + (s.title?.mm || 'N/A'));
      print('');
    });
  `);

  console.log(output);
}

/**
 * Show specific section
 */
function showSection(sectionName) {
  console.log(`${c.bright}${c.blue}Section: ${sectionName}${c.reset}\n`);

  const output = mongoExec(`
    const page = db.pages.findOne(
      {organizationId: ObjectId('${ORG_ID}'), slug: '${PAGE_SLUG}'}
    );
    const section = page.sections.find(s => s.name === '${sectionName}');
    if (section) {
      print(JSON.stringify(section, null, 2));
    } else {
      print('Section not found: ${sectionName}');
    }
  `);

  console.log(output);
}

/**
 * Main
 */
function main() {
  const command = process.argv[2] || 'help';
  const arg = process.argv[3];

  switch (command) {
    case 'list':
      listSections();
      break;

    case 'show':
      if (!arg) {
        console.log(`${c.red}✗ Please provide section name${c.reset}`);
        console.log('Usage: node scripts/update-um1-sections.js show <section-name>');
        return;
      }
      showSection(arg);
      break;

    case 'help':
    default:
      console.log(`${c.bright}${c.blue}UM1 Section Management${c.reset}\n`);
      console.log('Usage: node scripts/update-um1-sections.js [command]\n');
      console.log('Commands:');
      console.log(`  ${c.green}list${c.reset}               - List all home page sections`);
      console.log(`  ${c.green}show <name>${c.reset}        - Show specific section details`);
      console.log('');
      console.log('Available sections:');
      console.log('  hero-welcome, services-overview, about-overview, main-cta');
      console.log('  client-testimonials, organization-gallery, frequently-asked-questions');
      console.log('  service-pricing, organization-data, enrollment-stats');
      console.log('  rector-message, organization-chart');
      break;
  }
}

main();
