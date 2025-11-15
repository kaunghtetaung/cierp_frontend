export default function StaffsDetailPage({ module, user, tenant, appId, itemId, searchParams }: any) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Staff Detail Page</h1>
      <p className="text-muted-foreground mt-2">
        This is the placeholder for staff detail/edit page
      </p>
      <div className="mt-4 p-4 border rounded-lg bg-muted/50">
        <p className="text-sm">Module: {module?.slug}</p>
        <p className="text-sm">App ID: {appId}</p>
        <p className="text-sm">Item ID: {itemId}</p>
        <p className="text-sm">User: {user?.email}</p>
        <p className="text-sm">Tenant: {tenant?.tenantId}</p>
      </div>
    </div>
  );
}
