'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui';
import { Input, Label, Textarea } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import { toast } from 'sonner';
import { checkoutBook } from '../actions/circulation.actions';
import { BarcodeScanner } from '../components/BarcodeScanner';
import type { CirculationResponse } from '../types/circulation.types';

interface CheckoutFormProps {
  onSuccess?: (circulation: CirculationResponse) => void;
  onCancel?: () => void;
}

export function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const [borrowerId, setBorrowerId] = useState('');
  const [accessionNo, setAccessionNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerId || !accessionNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await checkoutBook({
        borrowerId,
        accessionNo,
        notes: notes || undefined,
      });

      if (response.success && response.data) {
        toast.success('Book checked out successfully!', {
          description: `${response.data.bibliography?.title || 'Book'} checked out to ${response.data.borrower?.firstName} ${response.data.borrower?.lastName}`,
        });

        // Reset form
        setBorrowerId('');
        setAccessionNo('');
        setNotes('');

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        toast.error('Checkout failed', {
          description: response.error || 'An error occurred during checkout',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setBorrowerId('');
    setAccessionNo('');
    setNotes('');
    if (onCancel) {
      onCancel();
    }
  };

  const handleScan = (barcode: string) => {
    setAccessionNo(barcode);
    setIsScannerOpen(false);
    toast.success('Barcode scanned', {
      description: barcode,
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent name="BookOpen" className="w-5 h-5" />
          Checkout Book
        </CardTitle>
        <CardDescription>
          Check out a single book to a borrower
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Borrower ID */}
          <div className="space-y-2">
            <Label htmlFor="borrowerId">
              Borrower ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="borrowerId"
              type="text"
              placeholder="Enter borrower ID"
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the MongoDB ObjectId of the borrower
            </p>
          </div>

          {/* Accession Number */}
          <div className="space-y-2">
            <Label htmlFor="accessionNo">
              Accession Number <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="accessionNo"
                type="text"
                placeholder="Scan or enter accession number"
                value={accessionNo}
                onChange={(e) => setAccessionNo(e.target.value)}
                required
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isLoading}
                onClick={() => setIsScannerOpen(true)}
                title="Scan barcode"
              >
                <IconComponent name="Camera" className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Unique book copy identifier
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this checkout..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            <IconComponent name="X" className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !borrowerId || !accessionNo}
          >
            {isLoading ? (
              <>
                <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IconComponent name="Check" className="w-4 h-4 mr-2" />
                Checkout
              </>
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
        title="Scan Accession Number"
        description="Position the barcode within the camera frame"
      />
    </Card>
  );
}
