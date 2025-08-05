// Simple test to verify the import path works
async function testImport() {
  try {
    console.log('Testing import...');
    const { getModuleReferenceAction } = await import('@repo/app-modules/server-actions');
    console.log('Import successful:', typeof getModuleReferenceAction);
    
    // Test calling it with applications
    console.log('Testing call to applications...');
    const result = await getModuleReferenceAction('applications');
    console.log('Result:', result);
  } catch (error) {
    console.error('Import or call failed:', error);
  }
}

testImport();