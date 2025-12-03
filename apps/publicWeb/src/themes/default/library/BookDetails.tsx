'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLangSelector } from '@/feature-components/lang-selector';
import { PublicPdfViewer } from '@/components/pdf-viewer/PublicPdfViewer';
import { PageByPagePdfViewer } from '@/components/pdf-viewer/PageByPagePdfViewer';
import { getAuthorName } from '@/lib/library-utils';
import { checkAuthStatus } from '@/actions/auth/session.actions';
import type { Bibliography } from '@/actions/library/books.actions';
import { S3Image } from '@/components/common/S3Image';
import {
  checkReservationAvailability,
  createReservation,
  type ReservationAvailability
} from '@/actions/library/reservation.actions';
import { LibraryMobileFooter } from '@/components/library/LibraryMobileFooter';

// Roles allowed to access eBooks
const EBOOK_ALLOWED_ROLES = [
  'student',
  'staff',
  'organizationadmin',
  'organizationmember',
  'departmentadmin',
  'departmentstaff',
  'systemadmin'
];

// Helper to extract role name from role object or string
function getRoleName(role: any): string {
  if (typeof role === 'string') return role.toLowerCase();
  if (role && typeof role === 'object' && role.Role) return role.Role.toLowerCase();
  return '';
}

// Check if user has any of the allowed roles for eBook access
function canUserAccessEbooks(roles: any[]): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((role: any) => EBOOK_ALLOWED_ROLES.includes(getRoleName(role)));
}

interface BookDetailsProps {
  book: Bibliography;
}

export function BookDetails({ book }: BookDetailsProps) {
  const router = useRouter();
  const { currentLanguage } = useLangSelector();
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
  }>({
    isOpen: false,
    pdfUrl: '',
    title: ''
  });

  const [ebookViewerState, setEbookViewerState] = useState<{
    isOpen: boolean;
    pdfUrl: string;
    title: string;
  }>({
    isOpen: false,
    pdfUrl: '',
    title: ''
  });

  // Check if user is logged in and has eBook access
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canAccessEbooks, setCanAccessEbooks] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Reservation state
  const [reservationAvailability, setReservationAvailability] = useState<ReservationAvailability | null>(null);
  const [isCheckingReservation, setIsCheckingReservation] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Check login status on mount using server action (can access HttpOnly cookies)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[BookDetails] Checking auth status...');
        const authStatus = await checkAuthStatus();
        console.log('[BookDetails] Auth status:', authStatus);
        setIsLoggedIn(authStatus.isAuthenticated);
        setUserId(authStatus.userId);
        // Check if user has allowed role for eBook access
        setCanAccessEbooks(canUserAccessEbooks(authStatus.userRoles || []));
      } catch (error) {
        console.error('[BookDetails] Error checking auth:', error);
        setIsLoggedIn(false);
        setCanAccessEbooks(false);
        setUserId(undefined);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Check reservation availability when user is logged in
  useEffect(() => {
    const checkReservation = async () => {
      if (!isLoggedIn || isCheckingAuth) return;

      setIsCheckingReservation(true);
      try {
        console.log('[BookDetails] Checking reservation availability...');
        const result = await checkReservationAvailability(book._id);
        console.log('[BookDetails] Reservation availability:', result);
        if (result.success && result.data) {
          setReservationAvailability(result.data);
        }
      } catch (error) {
        console.error('[BookDetails] Error checking reservation:', error);
      } finally {
        setIsCheckingReservation(false);
      }
    };

    checkReservation();
  }, [isLoggedIn, isCheckingAuth, book._id]);

  // Multilingual text
  const texts = {
    backToSearch: currentLanguage === 'mm' ? 'ရှာဖွေမှုသို့ပြန်သွားမည်' : 'Back to Search',
    bookDetails: currentLanguage === 'mm' ? 'စာအုပ်အသေးစိတ်' : 'Book Details',
    by: currentLanguage === 'mm' ? 'စာရေးသူ:' : 'Author:',
    publisher: currentLanguage === 'mm' ? 'ထုတ်ဝေသူ:' : 'Publisher:',
    year: currentLanguage === 'mm' ? 'ထုတ်ဝေသည့်နှစ်:' : 'Publication Year:',
    isbn: currentLanguage === 'mm' ? 'ISBN:' : 'ISBN:',
    callNo: currentLanguage === 'mm' ? 'Call Number:' : 'Call Number:',
    status: currentLanguage === 'mm' ? 'အခြေအနေ:' : 'Status:',
    catalogType: currentLanguage === 'mm' ? 'အမျိုးအစား:' : 'Catalog Type:',
    subjects: currentLanguage === 'mm' ? 'ဘာသာရပ်များ:' : 'Subjects:',
    degrees: currentLanguage === 'mm' ? 'ဘွဲ့များ:' : 'Degrees:',
    organization: currentLanguage === 'mm' ? 'အဖွဲ့အစည်း:' : 'Organization:',
    description: currentLanguage === 'mm' ? 'ဖော်ပြချက်:' : 'Description:',
    viewAbstract: currentLanguage === 'mm' ? 'အကျဉ်းချုပ်ကြည့်မည်' : 'View Abstract',
    viewContent: currentLanguage === 'mm' ? 'အကြောင်းအရာကြည့်မည်' : 'View Content',
    readEbook: currentLanguage === 'mm' ? 'eBook ဖတ်မည်' : 'Read eBook',
    downloadAbstract: currentLanguage === 'mm' ? 'အကျဉ်းချုပ်ဒေါင်းလုဒ်' : 'Download Abstract',
    downloadContent: currentLanguage === 'mm' ? 'အကြောင်းအရာဒေါင်းလုဒ်' : 'Download Content',
    remark: currentLanguage === 'mm' ? 'မှတ်ချက်:' : 'Remark:',
    note: currentLanguage === 'mm' ? 'မှတ်စု:' : 'Note:',
    bookCopies: currentLanguage === 'mm' ? 'စာအုပ်အရေအတွက်:' : 'Available Copies:',
    noDescription: currentLanguage === 'mm' ? 'ဖော်ပြချက်မရှိပါ' : 'No description available',
    reserveBook: currentLanguage === 'mm' ? 'စာအုပ်ကြိုတင်မှာကြားမည်' : 'Reserve Book',
    available: currentLanguage === 'mm' ? 'ရရှိနိုင်သည်' : 'Available',
    notAvailable: currentLanguage === 'mm' ? 'ရရှိနိုင်မှုမရှိပါ' : 'Not Available',
    loginRequired: currentLanguage === 'mm' ? 'eBook ဖတ်ရန် အကောင့်ဝင်ရန်လိုအပ်သည်' : 'Login required to read eBook',
    // Reservation texts
    reserving: currentLanguage === 'mm' ? 'ကြိုတင်မှာကြားနေသည်...' : 'Reserving...',
    reservationSuccess: currentLanguage === 'mm' ? 'ကြိုတင်မှာကြားမှုအောင်မြင်ပါသည်!' : 'Reservation successful!',
    reservationSuccessDesc: currentLanguage === 'mm'
      ? 'စာအုပ်ရရှိနိုင်သောအခါ သင့်ကိုအကြောင်းကြားပါမည်။'
      : 'You will be notified when the book is available.',
    alreadyReserved: currentLanguage === 'mm' ? 'ဤစာအုပ်ကို သင်ကြိုတင်မှာထားပြီးဖြစ်သည်' : 'You already have a reservation for this book',
    viewMyReservations: currentLanguage === 'mm' ? 'ကျွန်ုပ်၏ကြိုတင်မှာကြားမှုများကြည့်မည်' : 'View My Reservations',
    cannotReserve: currentLanguage === 'mm' ? 'ကြိုတင်မှာကြား၍မရပါ' : 'Cannot reserve',
    loginToReserve: currentLanguage === 'mm' ? 'ကြိုတင်မှာကြားရန် အကောင့်ဝင်ပါ' : 'Login to reserve',
    queuePosition: currentLanguage === 'mm' ? 'တန်းစီနေရာ' : 'Queue Position',
    estimatedWait: currentLanguage === 'mm' ? 'ခန့်မှန်းစောင့်ဆိုင်းချိန်' : 'Estimated Wait',
    peopleWaiting: currentLanguage === 'mm' ? 'ဦးစောင့်ဆိုင်းနေသည်' : 'people waiting',
    availableCopies: currentLanguage === 'mm' ? 'ရရှိနိုင်သောမိတ္တူ' : 'Available Copies',
    allCopiesOut: currentLanguage === 'mm' ? 'မိတ္တူအားလုံးငှားထုတ်ထားသည်' : 'All copies are checked out',
    checkingAvailability: currentLanguage === 'mm' ? 'စစ်ဆေးနေသည်...' : 'Checking availability...',
  };

  const handleOpenPdfViewer = (pdfUrl: string, title: string) => {
    setPdfViewerState({
      isOpen: true,
      pdfUrl,
      title
    });
  };

  const handleClosePdfViewer = () => {
    setPdfViewerState({
      isOpen: false,
      pdfUrl: '',
      title: ''
    });
  };

  const handleCloseEbookViewer = () => {
    setEbookViewerState({
      isOpen: false,
      pdfUrl: '',
      title: ''
    });
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReadEbook = () => {
    console.log('[BookDetails] handleReadEbook called', {
      canAccessEbooks,
      hasEbookFile: !!book.ebookFile,
      ebookFile: book.ebookFile
    });

    if (!canAccessEbooks) {
      // This shouldn't happen as button is hidden, but safety check
      return;
    }

    if (!book.ebookFile) {
      console.log('[BookDetails] No ebookFile available');
      return;
    }

    // Build proxy URL (without page parameter - viewer will add it)
    // IMPORTANT: Use 'library' as app name because eBooks are stored in library service bucket
    const proxyUrl = `/api/media/pdf-proxy?file=${encodeURIComponent(book.ebookFile)}&app=library`;
    console.log('[BookDetails] Opening eBook with page-by-page viewer:', proxyUrl);

    setEbookViewerState({
      isOpen: true,
      pdfUrl: proxyUrl,
      title: `${book.title} - eBook`
    });
  };

  // Check if abstract, content, or ebook files exist
  const hasAbstract = book.abstract && book.abstractFile;
  const hasContent = book.content && book.contentFile;
  const hasEbook = !!book.ebookFile;

  // Check if book is available for reservation
  const isAvailable = book.bookCopyCount && book.bookCopyCount > 0;

  // Get organization name based on current language from displayName object
  const organizationName = book.organizationId?.displayName?.[currentLanguage] ||
                           book.organizationId?.shortName ||
                           book.organizationId?.fullName;

  const handleReserveBook = async () => {
    if (!isLoggedIn) {
      // Redirect to login
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (reservationAvailability?.hasExistingReservation) {
      router.push('/library/my-reservations');
      return;
    }

    if (!reservationAvailability?.canReserve) {
      setReservationError(reservationAvailability?.reason || texts.cannotReserve);
      return;
    }

    setIsReserving(true);
    setReservationError(null);

    try {
      console.log('[BookDetails] Creating reservation for:', book._id);
      const result = await createReservation(book._id);

      if (result.success) {
        setReservationSuccess(true);
        // Refresh reservation availability
        const updatedAvailability = await checkReservationAvailability(book._id);
        if (updatedAvailability.success && updatedAvailability.data) {
          setReservationAvailability(updatedAvailability.data);
        }
      } else {
        setReservationError(result.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('[BookDetails] Error creating reservation:', error);
      setReservationError('An error occurred while creating reservation');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header with Back Button */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {texts.backToSearch}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Book Cover and Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {/* Book Cover */}
                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
                  <div className="aspect-[2/3] bg-muted flex items-center justify-center relative">
                    {book.bookCoverImage ? (
                      <S3Image
                        src={book.bookCoverImage}
                        alt={book.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 p-8">
                        {/* Default Book Icon */}
                        <svg
                          className="h-32 w-32 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>

                        {/* Organization Logo/Name */}
                        {organizationName && (
                          <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                              {organizationName}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full shadow-md ${
                          book.status === 'Active'
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>
                  </div>

                  {/* PDF Actions */}
                  {(hasAbstract || hasContent || hasEbook) && (
                    <div className="p-4 border-t border-border space-y-2">
                      <p className="text-sm font-semibold text-foreground mb-3">
                        {currentLanguage === 'mm' ? 'PDF ဖိုင်များ' : 'Available PDFs'}
                      </p>

                      {/* eBook Button - Only show if user has allowed role */}
                      {hasEbook && canAccessEbooks && (
                        <div className="space-y-2 mb-3">
                          <button
                            onClick={handleReadEbook}
                            className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {texts.readEbook}
                          </button>
                        </div>
                      )}

                      {hasAbstract && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleOpenPdfViewer(book.abstractFile!, `${book.title} - Abstract`)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {texts.viewAbstract}
                          </button>
                          <button
                            onClick={() => handleDownload(book.abstractFile!, `${book.title}_abstract.pdf`)}
                            className="w-full bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {texts.downloadAbstract}
                          </button>
                        </div>
                      )}

                      {hasContent && (
                        <div className="space-y-2 mt-3">
                          <button
                            onClick={() => handleOpenPdfViewer(book.contentFile!, `${book.title} - Content`)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {texts.viewContent}
                          </button>
                          <button
                            onClick={() => handleDownload(book.contentFile!, `${book.title}_content.pdf`)}
                            className="w-full bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {texts.downloadContent}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reservation Section */}
                  <div className="p-4 border-t border-border">
                    {/* Success Message */}
                    {reservationSuccess && (
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-semibold text-green-900 dark:text-green-200">{texts.reservationSuccess}</p>
                            <p className="text-sm text-green-800 dark:text-green-300 mt-1">{texts.reservationSuccessDesc}</p>
                            <button
                              onClick={() => router.push('/library/my-reservations')}
                              className="text-sm text-green-700 dark:text-green-400 hover:underline mt-2 inline-flex items-center gap-1"
                            >
                              {texts.viewMyReservations}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {reservationError && (
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm text-red-800 dark:text-red-300">{reservationError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading/Checking State */}
                    {isCheckingReservation && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2"></div>
                        <span className="text-sm text-muted-foreground">{texts.checkingAvailability}</span>
                      </div>
                    )}

                    {/* Already Reserved */}
                    {!isCheckingReservation && reservationAvailability?.hasExistingReservation && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-200">{texts.alreadyReserved}</p>
                            <button
                              onClick={() => router.push('/library/my-reservations')}
                              className="text-sm text-blue-700 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                            >
                              {texts.viewMyReservations}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Can Reserve - Show queue info and button */}
                    {!isCheckingReservation && !reservationSuccess && !reservationAvailability?.hasExistingReservation && (
                      <>
                        {/* Availability Info */}
                        {reservationAvailability && (
                          <div className="space-y-2 mb-4">
                            {/* Available copies info */}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{texts.availableCopies}:</span>
                              <span className={`font-medium ${reservationAvailability.availableCopies > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                {reservationAvailability.availableCopies} / {reservationAvailability.totalCopies}
                              </span>
                            </div>

                            {/* Queue info - only show if there are people waiting */}
                            {reservationAvailability.currentQueue > 0 && (
                              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>
                                    <strong>{reservationAvailability.currentQueue}</strong> {texts.peopleWaiting}
                                  </span>
                                </div>
                                {reservationAvailability.estimatedWaitTime && (
                                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 ml-6">
                                    {texts.estimatedWait}: {reservationAvailability.estimatedWaitTime}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* All copies checked out message */}
                            {reservationAvailability.availableCopies === 0 && (
                              <p className="text-xs text-muted-foreground">{texts.allCopiesOut}</p>
                            )}
                          </div>
                        )}

                        {/* Reserve Button */}
                        {isLoggedIn ? (
                          reservationAvailability?.canReserve ? (
                            <button
                              onClick={handleReserveBook}
                              disabled={isReserving}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isReserving ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                  {texts.reserving}
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  {texts.reserveBook}
                                </>
                              )}
                            </button>
                          ) : reservationAvailability?.reason ? (
                            <div className="bg-muted rounded-md p-3 text-center">
                              <svg className="w-5 h-5 mx-auto text-muted-foreground mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-sm text-muted-foreground">{reservationAvailability.reason}</p>
                            </div>
                          ) : null
                        ) : (
                          <button
                            onClick={() => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                            className="w-full bg-muted hover:bg-muted/80 text-foreground py-3 px-4 rounded-md font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            {texts.loginToReserve}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Book Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Basic Info */}
              <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  {book.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {book.author && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.by}</span>
                      <p className="text-foreground mt-1">{getAuthorName(book.author)}</p>
                    </div>
                  )}

                  {book.publisher && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.publisher}</span>
                      <p className="text-foreground mt-1">{book.publisher.name}</p>
                    </div>
                  )}

                  {book.year && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.year}</span>
                      <p className="text-foreground mt-1">{book.year}</p>
                    </div>
                  )}

                  {book.isbn && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.isbn}</span>
                      <p className="text-foreground mt-1 font-mono">{book.isbn}</p>
                    </div>
                  )}

                  {book.callNo && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.callNo}</span>
                      <p className="text-foreground mt-1 font-mono">{book.callNo}</p>
                    </div>
                  )}

                  {book.catalogType && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.catalogType}</span>
                      <p className="text-foreground mt-1">{book.catalogType.name}</p>
                    </div>
                  )}

                  {typeof book.bookCopyCount === 'number' && book.bookCopyCount > 0 && (
                    <div>
                      <span className="font-semibold text-muted-foreground">{texts.bookCopies}</span>
                      <p className="text-foreground mt-1">{book.bookCopyCount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {texts.description}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Subjects */}
              {book.subjects && book.subjects.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {texts.subjects}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {book.subjects.map((subject) => (
                      <span
                        key={subject._id || subject.id}
                        className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Degrees */}
              {book.degrees && book.degrees.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {texts.degrees}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {book.degrees.map((degree) => (
                      <span
                        key={degree._id || degree.id}
                        className="inline-block px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full text-sm font-medium"
                      >
                        {degree.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Organization */}
              {book.organizationId && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {texts.organization}
                  </h2>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-foreground">
                      {book.organizationId.displayName?.[currentLanguage] || book.organizationId.fullName}
                    </p>
                    {book.organizationId.shortName && (
                      <p className="text-sm text-muted-foreground">
                        ({book.organizationId.shortName})
                      </p>
                    )}
                    {book.organizationId.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {book.organizationId.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Note */}
              {book.note && (
                <div className="bg-card border border-border rounded-lg p-6 shadow-md">
                  <h2 className="text-xl font-semibold text-foreground mb-3">
                    {texts.note}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {book.note.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              )}

              {/* Remark */}
              {book.remark && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-semibold text-amber-900 dark:text-amber-200">{texts.remark}</span>
                      <p className="text-amber-800 dark:text-amber-300 mt-1">{book.remark}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal (for abstracts and content files) */}
      {pdfViewerState.isOpen && (
        <PublicPdfViewer
          pdfUrl={pdfViewerState.pdfUrl}
          title={pdfViewerState.title}
          onClose={handleClosePdfViewer}
        />
      )}

      {/* eBook Viewer Modal (page-by-page with watermarks) */}
      {ebookViewerState.isOpen && (
        <PageByPagePdfViewer
          pdfUrl={ebookViewerState.pdfUrl}
          title={ebookViewerState.title}
          watermark={book.title}
          onClose={handleCloseEbookViewer}
          bookId={book._id || book.id}
          userId={userId}
        />
      )}

      {/* Mobile Footer Navigation */}
      <LibraryMobileFooter />
    </div>
  );
}
