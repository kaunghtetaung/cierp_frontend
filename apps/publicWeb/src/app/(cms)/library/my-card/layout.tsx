import type { ReactNode } from 'react';

interface MyCardLayoutProps {
  children: ReactNode;
}

/**
 * Special layout for My Card page - fullscreen on mobile, centered card on desktop
 * Removes header/footer for immersive card experience
 */
export default function MyCardLayout({ children }: MyCardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {children}
    </div>
  );
}

// Metadata
export const metadata = {
  title: 'My Library Card',
  description: 'Your digital library borrower card',
};
