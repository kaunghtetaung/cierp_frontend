'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Add to Home Screen prompt for PWA installation on mobile
 * Shows on mobile devices when the library card page is accessed
 */
export function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');

    if (!isInStandaloneMode && !hasDismissed) {
      // Listen for beforeinstallprompt event (Android/Chrome)
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // For iOS, show manual instructions if not already in standalone mode
      if (iOS && !(window.navigator as any).standalone) {
        setShowPrompt(true);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or prompt is hidden
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="md:hidden mb-4">
      <Alert className="bg-primary/5 border-primary/20">
        <IconComponent name="Smartphone" className="h-5 w-5 text-primary" />
        <AlertDescription>
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-sm mb-1">Quick Access to Your Library Card</h3>
              <p className="text-xs text-muted-foreground">
                Add this page to your home screen for instant access to your digital library card.
              </p>
            </div>

            {isIOS ? (
              // iOS manual instructions
              <div className="text-xs space-y-2 bg-background/50 p-3 rounded-md">
                <p className="font-medium">To install:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Tap the <IconComponent name="Share" className="w-3 h-3 inline mx-1" /> Share button below</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                </ol>
              </div>
            ) : (
              // Android/Chrome install button
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="flex-1"
                  disabled={!deferredPrompt}
                >
                  <IconComponent name="Download" className="w-4 h-4 mr-2" />
                  Add to Home Screen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  <IconComponent name="X" className="w-4 h-4" />
                </Button>
              </div>
            )}

            {!isIOS && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs h-auto py-1"
              >
                Don't show again
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
