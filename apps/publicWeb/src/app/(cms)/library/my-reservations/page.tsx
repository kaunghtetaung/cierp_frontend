import { QueryProvider } from '@/lib/providers/QueryProvider';
import { MyReservations } from '@/themes/default/library/MyReservations';

export default function MyReservationsPage() {
  return (
    <QueryProvider>
      <MyReservations />
    </QueryProvider>
  );
}

export const metadata = {
  title: 'My Reservations | Library',
  description: 'View and manage your book reservations'
};
