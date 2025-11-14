export default function BarcodePage({
  module,
  user,
  tenant,
  appId,
  slug,
  slugPath,
  searchParams
}: any) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Barcode Management</h1>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Custom route for bibliographies barcode functionality
        </p>

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Route Information:</h2>
          <ul className="space-y-1 text-sm">
            <li><strong>App:</strong> {appId}</li>
            <li><strong>Module:</strong> {module?.slug}</li>
            <li><strong>Route:</strong> {slugPath}</li>
            <li><strong>User:</strong> {user?.email || user?.id}</li>
            <li><strong>Tenant:</strong> {tenant?.slug}</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            ✅ Custom Static Route Working!
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This page is loaded from: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
              staticModules/library/bibliographies/barcode/page.tsx
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
