#!/usr/bin/env node

/**
 * Update UM1 Hero Section with Production Data
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORG_ID = '68d12d98e776d47ad2004f19'; // um1
const PAGE_SLUG = 'home';

// Real UM1 Hero Section Data
const heroData = {
  type: 'hero',
  name: 'hero-welcome',
  title: {
    en: 'Welcome to University of Medicine 1, Yangon',
    mm: 'ရန်ကုန် ဆေးတက္ကသိုလ် (၁) မှ ကြိုဆိုပါသည်'
  },
  headline: {
    en: 'Center of Excellence in Medical Education',
    mm: 'ဆေးပညာ ပညာရေး၏ ထူးချွန်မှု ဗဟို'
  },
  subheadline: {
    en: 'To become Center of Excellence in Medical Education, Health Service and Research',
    mm: 'ဆေးပညာ ပညာရေး၊ ကျန်းမာရေး ဝန်ဆောင်မှု နှင့် သုတေသန ထူးချွန်မှု ဗဟိုဌာန ဖြစ်လာရန်'
  },
  buttons: [
    {
      text: { en: 'Learn More', mm: 'ပိုမိုလေ့လာပါ' },
      url: '/about',
      style: 'primary',
      openInNewTab: false
    },
    {
      text: { en: 'Contact Us', mm: 'ဆက်သွယ်ပါ' },
      url: '/contact',
      style: 'secondary',
      openInNewTab: false
    }
  ],
  textAlignment: 'center',
  height: 'large',
  backgroundImage: 'http://203.81.66.116:9000/um1/ctms/public/hero-cover.jpg',
  overlay: {
    enabled: true,
    color: '#000000',
    opacity: 0.4
  },
  order: 0,
  isVisible: true,
  isEnabled: true,
  isReusable: true,
  organizationId: '68d12d98e776d47ad2004f19',
  status: 'Active',
  version: 0,
  spacing: {
    paddingTop: '80px',
    paddingBottom: '80px'
  }
};

function main() {
  console.log('🚀 Updating UM1 Hero Section...\n');

  // Write MongoDB script to temp file
  const scriptPath = '/tmp/update-hero.js';
  const mongoScript = `
// Update hero section
const heroData = ${JSON.stringify(heroData, null, 2)};

const result = db.pages.updateOne(
  {
    organizationId: ObjectId('${ORG_ID}'),
    slug: '${PAGE_SLUG}',
    'sections.name': 'hero-welcome'
  },
  {
    $set: {
      'sections.$': heroData
    }
  }
);

print(JSON.stringify({
  matched: result.matchedCount,
  modified: result.modifiedCount
}));
`;

  fs.writeFileSync(scriptPath, mongoScript);

  try {
    // Execute MongoDB script
    const output = execSync(
      `docker exec -i ciapp-mongo mongosh -u cidbaccess -p cidb1234 --authenticationDatabase admin ciapp --quiet < ${scriptPath}`,
      { encoding: 'utf-8' }
    );

    const result = JSON.parse(output.trim());

    console.log('✅ Hero Section Updated Successfully!\n');
    console.log(`   Matched: ${result.matched} documents`);
    console.log(`   Modified: ${result.modified} documents\n`);

    console.log('📝 Updated Data:');
    console.log(`   Title (EN): ${heroData.title.en}`);
    console.log(`   Title (MM): ${heroData.title.mm}`);
    console.log(`   Headline (EN): ${heroData.headline.en}`);
    console.log(`   Headline (MM): ${heroData.headline.mm}`);
    console.log(`   Subheadline (EN): ${heroData.subheadline.en}`);
    console.log(`   Background Image: ${heroData.backgroundImage}\n`);

    console.log('🌐 View your changes at: http://app.um1ygn.edu.mm/\n');

    // Cleanup
    fs.unlinkSync(scriptPath);

  } catch (error) {
    console.error('❌ Error updating hero section:', error.message);
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    process.exit(1);
  }
}

main();
