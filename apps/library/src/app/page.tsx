import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";

/**
 * Library Application Home Page
 * Main dashboard for the library management system
 */
export default function LibraryHomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Library Management System</h1>
        <p className="text-muted-foreground">
          Welcome to the library management dashboard. Manage your library resources, users, and operations.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Book Catalog</CardTitle>
            <CardDescription>
              Manage your book collection, add new titles, and track inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse and manage your complete book catalog
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage library members, issue cards, and track user activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Handle library member registrations and profiles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Borrowing System</CardTitle>
            <CardDescription>
              Track book loans, returns, and due dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage the complete borrowing lifecycle
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
            <CardDescription>
              View library statistics, usage reports, and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate comprehensive library reports
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Digital Resources</CardTitle>
            <CardDescription>
              Manage e-books, audiobooks, and digital content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access and organize digital library materials
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Configure library settings, policies, and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customize your library management system
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}