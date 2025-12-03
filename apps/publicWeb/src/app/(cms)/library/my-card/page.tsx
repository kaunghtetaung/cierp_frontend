import { redirect } from 'next/navigation';
import { getCurrentUser } from '@repo/auth/server';
import { getMyBorrowerCard } from '@/actions/library/borrower.actions';
import { DigitalBorrowerCard } from '@/components/library/DigitalBorrowerCard';
import { CardActions } from '@/components/library/CardActions';
import { AddToHomeScreen } from '@/components/library/AddToHomeScreen';
import { LibraryMobileFooter } from '@/components/library/LibraryMobileFooter';
import { Alert, AlertDescription } from '@repo/ui';
import { IconComponent, Button } from '@repo/ui';
import Link from 'next/link';
import { getApiDomain } from '@repo/utils/server';
import { getCurrentTenantForClient } from '@repo/tenant/wrapper';
import './barcode.css';

// Metadata with font preload
export const metadata = {
  title: 'My Library Card | University Library',
  description: 'View your digital library borrower card with QR code'
};

export default async function MyCardPage() {
  const user = await getCurrentUser();
  if (!user) {
    const callbackUrl = encodeURIComponent('/library/my-card');
    redirect(`/api/auth/login?callbackUrl=${callbackUrl}`);
  }

  const borrowerResponse = await getMyBorrowerCard();
  const apiDomain = await getApiDomain();
  const tenant = await getCurrentTenantForClient();

  if (!borrowerResponse.success || !borrowerResponse.data) {
    const debugInfo = {
      requestUrl: `${apiDomain}/library/borrowers/my-borrower`,
      requestMethod: 'GET',
      requestHeaders: `x-user-id: ${user.id}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.displayName || user.username,
      error: borrowerResponse.error,
      timestamp: new Date().toISOString(),
    };

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/library">
            <Button variant="ghost" size="sm">
              <IconComponent name="ArrowLeft" className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <IconComponent name="AlertCircle" className="h-4 w-4" />
          <AlertDescription>
            <h3 className="font-semibold mb-2">No Borrower Card Found</h3>
            <p className="font-mono text-sm text-destructive">
              {borrowerResponse.error || 'You do not have an active library borrower card.'}
            </p>
            <p className="mt-2 text-sm">
              Please contact the library administration to register as a borrower.
            </p>
          </AlertDescription>
        </Alert>

        <Alert className="mt-6">
          <IconComponent name="Info" className="h-4 w-4" />
          <AlertDescription>
            <details className="cursor-pointer">
              <summary className="font-semibold mb-2 select-none">
                Debug Information (Click to expand)
              </summary>
              <div className="mt-3 space-y-2 text-xs font-mono bg-muted p-3 rounded">
                <div><strong className="text-primary">Request URL:</strong><div className="break-all text-muted-foreground mt-1">{debugInfo.requestUrl}</div></div>
                <div><strong className="text-primary">Request Method:</strong><div className="text-muted-foreground mt-1">{debugInfo.requestMethod}</div></div>
                <div><strong className="text-primary">Request Headers:</strong><div className="text-muted-foreground mt-1">{debugInfo.requestHeaders}</div></div>
                <div><strong className="text-primary">User ID:</strong><div className="text-muted-foreground mt-1">{debugInfo.userId}</div></div>
                <div><strong className="text-primary">User Email:</strong><div className="text-muted-foreground mt-1">{debugInfo.userEmail}</div></div>
                <div><strong className="text-primary">User Name:</strong><div className="text-muted-foreground mt-1">{debugInfo.userName}</div></div>
                <div><strong className="text-destructive">Error Message:</strong><div className="text-destructive mt-1">{debugInfo.error}</div></div>
                <div><strong className="text-primary">Timestamp:</strong><div className="text-muted-foreground mt-1">{debugInfo.timestamp}</div></div>
              </div>
            </details>
          </AlertDescription>
        </Alert>

        <div className="mt-6 text-center">
          <Link href="/library">
            <Button><IconComponent name="BookOpen" className="w-4 h-4 mr-2" />Browse Library Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
      {/* Header Bar - Same pattern as PDF Viewer */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card backdrop-blur-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/library">
            <Button variant="ghost" size="sm">
              <IconComponent name="ArrowLeft" className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Back to Library</span>
            </Button>
          </Link>
          <h2 className="hidden md:block text-lg font-semibold text-foreground truncate">
            My Library Card
          </h2>
        </div>
        <CardActions />
      </div>

      {/* Content Area - Flex-1 takes remaining viewport space */}
      <div className="flex-1 overflow-y-auto print:flex print:items-center print:justify-center print:fixed print:inset-0">
        {/* Mobile: Full width card */}
        <div className="md:hidden p-4 pb-20 print:!hidden">
          <AddToHomeScreen />
          <DigitalBorrowerCard borrower={borrowerResponse.data} showDetails={true} tenant={tenant} />
          <div className="mt-4 space-y-3">
            {borrowerResponse.data.unpaidFines > 0 && (
              <Alert variant="destructive" className="text-sm">
                <IconComponent name="AlertTriangle" className="h-4 w-4" />
                <AlertDescription><p className="font-semibold">Outstanding Fines</p><p className="text-xs mt-1">{borrowerResponse.data.unpaidFines} MMK unpaid</p></AlertDescription>
              </Alert>
            )}
            {borrowerResponse.data.overdueCount > 0 && (
              <Alert variant="destructive" className="text-sm">
                <IconComponent name="AlertCircle" className="h-4 w-4" />
                <AlertDescription><p className="font-semibold">Overdue Books</p><p className="text-xs mt-1">{borrowerResponse.data.overdueCount} overdue book(s)</p></AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Desktop: Centered card with max width */}
        <div className="hidden md:flex justify-center items-start p-8 print:flex print:items-center print:p-0">
          <div className="w-full max-w-3xl space-y-6 print:max-w-none print:w-[85.6mm]">
            <DigitalBorrowerCard borrower={borrowerResponse.data} showDetails={true} tenant={tenant} />
            <div className="space-y-4">
            <Alert className="print:hidden">
              <IconComponent name="Info" className="h-4 w-4" />
              <AlertDescription>
                <h3 className="font-semibold mb-2">How to Use Your Digital Card</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Present the QR code at the library counter when borrowing books</li>
                  <li>Staff can scan the QR code to quickly access your borrower information</li>
                  <li>You can also provide your library card number: <strong>{borrowerResponse.data.libraryCardNumber}</strong></li>
                  <li>Keep your membership valid by returning books on time</li>
                </ul>
              </AlertDescription>
            </Alert>
            {borrowerResponse.data.unpaidFines > 0 && (
              <Alert variant="destructive">
                <IconComponent name="AlertTriangle" className="h-4 w-4" />
                <AlertDescription><h3 className="font-semibold mb-2">Outstanding Fines</h3><p>You have <strong>{borrowerResponse.data.unpaidFines} MMK</strong> in unpaid fines. Please settle your fines at the library counter to continue borrowing.</p></AlertDescription>
              </Alert>
            )}
            {borrowerResponse.data.overdueCount > 0 && (
              <Alert variant="destructive">
                <IconComponent name="AlertCircle" className="h-4 w-4" />
                <AlertDescription><h3 className="font-semibold mb-2">Overdue Books</h3><p>You have <strong>{borrowerResponse.data.overdueCount}</strong> overdue book(s). Please return them as soon as possible to avoid additional fines.</p></AlertDescription>
              </Alert>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer Navigation */}
      <LibraryMobileFooter />
    </div>
  );
}

