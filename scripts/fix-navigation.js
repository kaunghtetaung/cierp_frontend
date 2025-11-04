// Script to fix navigation structure
// 1. Remove headerMenu from settings
// 2. Create History and Campuses as children of About navigation item

const organizationId = ObjectId('68d12d98e776d47ad2004ef6');
const currentDate = new Date();
const createdBy = ObjectId('68e0b62131f65aa7c3783438');

print('=== Step 1: Remove headerMenu from settings ===');
const removeResult = db.settings.updateOne(
  { organizationId: organizationId },
  { $unset: { headerMenu: "" } }
);
print('Settings updated:', removeResult.modifiedCount > 0 ? 'Yes' : 'No');

print('\n=== Step 2: Get About navigation item ===');
const aboutNav = db.navigations.findOne({
  slug: 'about',
  menuType: 'header',
  level: 0,
  organizationId: organizationId
});

if (!aboutNav) {
  print('ERROR: About navigation item not found!');
  quit(1);
}

print('About navigation ID:', aboutNav._id);

print('\n=== Step 3: Create History navigation item ===');
const historyNav = {
  title: {
    en: 'History',
    mm: 'သမိုင်း'
  },
  slug: 'history',
  url: '/history',
  type: 'page',
  parentId: aboutNav._id,  // Set parent to About
  children: [],
  order: 0,
  level: 1,
  icon: '',
  cssClass: '',
  isVisible: true,
  openInNewTab: false,
  requiresAuth: false,
  allowedRoles: [],
  menuType: 'header',
  organizationId: organizationId,
  departmentId: null,
  status: 'Active',
  version: 0,
  createdBy: createdBy,
  createdAt: currentDate,
  updatedAt: currentDate
};

const historyResult = db.navigations.insertOne(historyNav);
print('History navigation created with ID:', historyResult.insertedId);

print('\n=== Step 4: Create Campuses navigation item ===');
const campusesNav = {
  title: {
    en: 'Campuses',
    mm: 'ကျောင်းဝင်းများ'
  },
  slug: 'campuses',
  url: '/campuses',
  type: 'page',
  parentId: aboutNav._id,  // Set parent to About
  children: [],
  order: 1,
  level: 1,
  icon: '',
  cssClass: '',
  isVisible: true,
  openInNewTab: false,
  requiresAuth: false,
  allowedRoles: [],
  menuType: 'header',
  organizationId: organizationId,
  departmentId: null,
  status: 'Active',
  version: 0,
  createdBy: createdBy,
  createdAt: currentDate,
  updatedAt: currentDate
};

const campusesResult = db.navigations.insertOne(campusesNav);
print('Campuses navigation created with ID:', campusesResult.insertedId);

print('\n=== Step 5: Update About navigation to have children references ===');
const updateAboutResult = db.navigations.updateOne(
  { _id: aboutNav._id },
  {
    $set: {
      children: [historyResult.insertedId, campusesResult.insertedId],
      url: '#',  // Change to # since it's now a dropdown parent
      updatedAt: currentDate
    }
  }
);
print('About navigation updated:', updateAboutResult.modifiedCount > 0 ? 'Yes' : 'No');

print('\n=== Verification ===');
print('Header menu structure:');
db.navigations.find({
  menuType: 'header',
  organizationId: organizationId,
  level: 0
}).sort({order: 1}).forEach(nav => {
  print(nav.order + '. ' + nav.title.en + ' (' + nav.url + ')');
  // Check if it has children
  const children = db.navigations.find({
    menuType: 'header',
    parentId: nav._id
  }).sort({order: 1});
  children.forEach(child => {
    print('   └─ ' + child.title.en + ' (' + child.url + ')');
  });
});

print('\n=== Complete ===');
print('✓ Removed headerMenu from settings');
print('✓ Created History navigation item');
print('✓ Created Campuses navigation item');
print('✓ Updated About navigation as parent');
