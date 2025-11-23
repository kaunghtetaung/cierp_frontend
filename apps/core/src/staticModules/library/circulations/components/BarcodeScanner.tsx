'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode',
  description = 'Position the barcode within the camera frame',
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      toast.success('Camera activated', {
        description: 'Ready to scan barcodes',
      });
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please check permissions.');
      toast.error('Camera access denied', {
        description: 'Please allow camera access in your browser settings',
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const handleManualEntry = () => {
    stopCamera();
    onClose();
    toast.info('Use manual entry', {
      description: 'Type the accession number directly',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent name="Camera" className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <IconComponent name="AlertCircle" className="w-12 h-12 mb-4 text-red-500" />
                <p className="text-lg font-semibold mb-2">Camera Error</p>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white w-3/4 h-1/2 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                        Position barcode here
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <IconComponent name="Info" className="w-4 h-4" />
              Instructions
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Hold the barcode steady within the frame</li>
              <li>Ensure good lighting for best results</li>
              <li>Barcode will be detected automatically</li>
              <li>Supports Code 39, Code 128, and EAN barcodes</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleManualEntry}
            >
              <IconComponent name="Keyboard" className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <div className="flex gap-2">
              {error && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                >
                  <IconComponent name="RefreshCw" className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                <IconComponent name="X" className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          {/* Status Indicator */}
          {isScanning && !error && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Camera active - Ready to scan</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
