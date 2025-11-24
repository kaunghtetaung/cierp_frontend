'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';

/**
 * Client component for card action buttons with event handlers
 */
export function CardActions() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes (e.g., when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleFullscreen} className="md:px-3">
        <IconComponent name={isFullscreen ? "Minimize2" : "Maximize2"} className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} className="md:px-3">
        <IconComponent name="Printer" className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Print</span>
      </Button>
    </div>
  );
}
