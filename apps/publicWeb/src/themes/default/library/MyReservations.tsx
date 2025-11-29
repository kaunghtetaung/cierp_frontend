'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLangSelector } from '@/feature-components/lang-selector';
import {
  getMyReservations,
  cancelReservation,
  type Reservation
} from '@/actions/library/reservation.actions';
import { S3Image } from '@/components/common/S3Image';

type FilterStatus = 'all' | 'pending' | 'ready';

export function MyReservations() {
  const router = useRouter();
  const { currentLanguage } = useLangSelector();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Multilingual texts
  const texts = {
    title: currentLanguage === 'mm' ? 'ကျွန်ုပ်၏ ကြိုတင်မှာကြားမှုများ' : 'My Reservations',
    backToLibrary: currentLanguage === 'mm' ? 'စာကြည့်တိုက်သို့ပြန်သွားမည်' : 'Back to Library',
    all: currentLanguage === 'mm' ? 'အားလုံး' : 'All',
    waiting: currentLanguage === 'mm' ? 'စောင့်ဆိုင်းနေသည်' : 'Waiting',
    readyForPickup: currentLanguage === 'mm' ? 'ထုတ်ယူရန်အဆင်သင့်' : 'Ready for Pickup',
    noReservations: currentLanguage === 'mm' ? 'ကြိုတင်မှာကြားမှုမရှိပါ' : 'No reservations found',
    browseBooks: currentLanguage === 'mm' ? 'စာအုပ်များရှာဖွေမည်' : 'Browse Books',
    queuePosition: currentLanguage === 'mm' ? 'တန်းစီနေရာ' : 'Queue Position',
    estimatedWait: currentLanguage === 'mm' ? 'ခန့်မှန်းစောင့်ဆိုင်းချိန်' : 'Estimated Wait',
    reservedOn: currentLanguage === 'mm' ? 'မှာကြားသည့်ရက်' : 'Reserved On',
    pickupDeadline: currentLanguage === 'mm' ? 'ထုတ်ယူရန်နောက်ဆုံးရက်' : 'Pickup Deadline',
    accessionNo: currentLanguage === 'mm' ? 'စာအုပ်နံပါတ်' : 'Accession No',
    cancelReservation: currentLanguage === 'mm' ? 'ပယ်ဖျက်မည်' : 'Cancel',
    cancelling: currentLanguage === 'mm' ? 'ပယ်ဖျက်နေသည်...' : 'Cancelling...',
    confirmCancel: currentLanguage === 'mm'
      ? 'ဤကြိုတင်မှာကြားမှုကို ပယ်ဖျက်လိုသည်မှာ သေချာပါသလား?'
      : 'Are you sure you want to cancel this reservation?',
    viewBook: currentLanguage === 'mm' ? 'စာအုပ်ကြည့်မည်' : 'View Book',
    pickupInstructions: currentLanguage === 'mm'
      ? 'ဤစာအုပ်ကိုထုတ်ယူရန် စာကြည့်တိုက်သို့သွားပါ။'
      : 'Please visit the library circulation desk to checkout this book.',
    expiresIn: currentLanguage === 'mm' ? 'ကျန်ရက်' : 'days left',
    expired: currentLanguage === 'mm' ? 'သက်တမ်းကုန်သွားပြီ' : 'Expired',
    loading: currentLanguage === 'mm' ? 'ဖွင့်နေသည်...' : 'Loading...',
    // Status labels
    statusPending: currentLanguage === 'mm' ? 'စောင့်ဆိုင်းနေသည်' : 'Waiting',
    statusReady: currentLanguage === 'mm' ? 'ထုတ်ယူရန်အဆင်သင့်' : 'Ready for Pickup',
    statusFulfilled: currentLanguage === 'mm' ? 'ငှားယူပြီး' : 'Checked Out',
    statusCancelled: currentLanguage === 'mm' ? 'ပယ်ဖျက်ပြီး' : 'Cancelled',
    statusExpired: currentLanguage === 'mm' ? 'သက်တမ်းကုန်ပြီး' : 'Expired',
  };

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Map filter to API status
        const statusMap: Record<FilterStatus, 'pending' | 'ready' | undefined> = {
          all: undefined,
          pending: 'pending',
          ready: 'ready'
        };

        const result = await getMyReservations(statusMap[filter]);

        if (result.success) {
          setReservations(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch reservations');
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('An error occurred while fetching reservations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [filter]);

  // Handle cancel reservation
  const handleCancel = async (reservationId: string) => {
    if (!confirm(texts.confirmCancel)) return;

    setCancellingId(reservationId);

    try {
      const result = await cancelReservation(reservationId, 'Cancelled by borrower');

      if (result.success) {
        // Remove from list or refresh
        setReservations(prev => prev.filter(r => (r.id || r._id) !== reservationId));
      } else {
        alert(result.error || 'Failed to cancel reservation');
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      alert('An error occurred while cancelling reservation');
    } finally {
      setCancellingId(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; label: string }> = {
      pending: {
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        label: texts.statusPending
      },
      ready: {
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        label: texts.statusReady
      },
      fulfilled: {
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        label: texts.statusFulfilled
      },
      cancelled: {
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        label: texts.statusCancelled
      },
      expired: {
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        label: texts.statusExpired
      }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'mm' ? 'my-MM' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days left until deadline
  const calculateDaysLeft = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => router.push('/library')}
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {texts.backToLibrary}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-6">{texts.title}</h1>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            {(['all', 'pending', 'ready'] as FilterStatus[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'all' ? texts.all : tab === 'pending' ? texts.waiting : texts.readyForPickup}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mr-3"></div>
              <span className="text-muted-foreground">{texts.loading}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && reservations.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-lg text-muted-foreground mb-4">{texts.noReservations}</p>
              <button
                type="button"
                onClick={() => router.push('/library')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {texts.browseBooks}
              </button>
            </div>
          )}

          {/* Reservations List */}
          {!isLoading && !error && reservations.length > 0 && (
            <div className="space-y-4">
              {reservations.map((reservation) => {
                const reservationId = reservation.id || reservation._id || '';
                const isCancelling = cancellingId === reservationId;
                const daysLeft = reservation.pickupDeadline ? calculateDaysLeft(reservation.pickupDeadline) : null;

                return (
                  <div
                    key={reservationId}
                    className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between p-4 bg-muted/30 border-b border-border">
                      <div className="flex items-start gap-4">
                        {/* Book Cover Thumbnail */}
                        <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                          {reservation.bibliography?.bookCoverImage ? (
                            <S3Image
                              src={reservation.bibliography.bookCoverImage}
                              alt={reservation.bibliography.title || ''}
                              width={64}
                              height={80}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {reservation.bibliography?.title || reservation.bibliographyTitle || 'Unknown Book'}
                          </h3>
                          {reservation.bibliography?.author?.name && (
                            <p className="text-sm text-muted-foreground">
                              {reservation.bibliography.author.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {getStatusBadge(reservation.status)}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Pending Status Info */}
                      {reservation.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{texts.queuePosition}:</span>
                            <p className="font-semibold text-foreground">#{reservation.queuePosition}</p>
                          </div>
                          {reservation.estimatedWaitTime && (
                            <div>
                              <span className="text-muted-foreground">{texts.estimatedWait}:</span>
                              <p className="font-semibold text-foreground">{reservation.estimatedWaitTime}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">{texts.reservedOn}:</span>
                            <p className="font-semibold text-foreground">{formatDate(reservation.reservationDate)}</p>
                          </div>
                        </div>
                      )}

                      {/* Ready Status Info */}
                      {reservation.status === 'ready' && (
                        <>
                          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <strong>{texts.readyForPickup}</strong>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1 ml-7">
                              {texts.pickupInstructions}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {reservation.accessionNo && (
                              <div>
                                <span className="text-muted-foreground">{texts.accessionNo}:</span>
                                <p className="font-mono font-semibold text-foreground">{reservation.accessionNo}</p>
                              </div>
                            )}
                            {reservation.pickupDeadline && (
                              <div>
                                <span className="text-muted-foreground">{texts.pickupDeadline}:</span>
                                <p className={`font-semibold ${daysLeft !== null && daysLeft <= 1 ? 'text-red-600' : 'text-foreground'}`}>
                                  {formatDate(reservation.pickupDeadline)}
                                  {daysLeft !== null && (
                                    <span className={`ml-2 text-xs ${daysLeft <= 1 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                      ({daysLeft > 0 ? `${daysLeft} ${texts.expiresIn}` : texts.expired})
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Fulfilled/Cancelled/Expired Info */}
                      {['fulfilled', 'cancelled', 'expired'].includes(reservation.status) && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">{texts.reservedOn}:</span>
                          <p className="font-semibold text-foreground">{formatDate(reservation.reservationDate)}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Actions */}
                    {['pending', 'ready'].includes(reservation.status) && (
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
                        <button
                          type="button"
                          onClick={() => router.push(`/library/${reservation.bibliographyId}`)}
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {texts.viewBook}
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancel(reservationId)}
                          disabled={isCancelling}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                              {texts.cancelling}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {texts.cancelReservation}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
