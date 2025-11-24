'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Badge } from '@repo/ui';
import { IconComponent } from '@repo/ui';
import type { BorrowerCardData } from '@/actions/library/borrower.actions';
import type { TenantSettings } from '@repo/types';
import { getLocalizedText } from '@repo/utils';
import Image from 'next/image';

interface DigitalBorrowerCardProps {
  borrower: BorrowerCardData;
  showDetails?: boolean;
  tenant?: TenantSettings | null;
}

export function DigitalBorrowerCard({ borrower, showDetails = true, tenant }: DigitalBorrowerCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  // Generate QR code
  useEffect(() => {
    if (canvasRef.current && borrower.libraryCardNumber) {
      QRCode.toCanvas(
        canvasRef.current,
        borrower.libraryCardNumber,
        {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('QR code generation error:', error);
            setQrError('Failed to generate QR code');
          }
        }
      );
    }
  }, [borrower.libraryCardNumber]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge variant
  const getStatusBadge = () => {
    switch (borrower.status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            <IconComponent name="CheckCircle" className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="default" className="bg-warning text-warning-foreground">
            <IconComponent name="AlertTriangle" className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="destructive">
            <IconComponent name="XCircle" className="w-3 h-3 mr-1" />
            Blocked
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <IconComponent name="Clock" className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{borrower.status}</Badge>;
    }
  };

  // Get borrower type badge with different colors
  const getBorrowerTypeBadge = () => {
    const typeConfig = {
      student: {
        label: 'Student',
        className: 'bg-blue-500 text-white border-blue-600',
      },
      staff: {
        label: 'Staff',
        className: 'bg-purple-500 text-white border-purple-600',
      },
      external: {
        label: 'External Member',
        className: 'bg-orange-500 text-white border-orange-600',
      },
    };

    const config = typeConfig[borrower.borrowerType] || {
      label: borrower.borrowerType,
      className: 'bg-gray-500 text-white border-gray-600',
    };

    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // Get display name
  const getDisplayName = () => {
    if (borrower.studentRecordId?.nameEnglish) {
      return borrower.studentRecordId.nameEnglish;
    }
    if (borrower.firstName && borrower.lastName) {
      return `${borrower.firstName} ${borrower.lastName}`;
    }
    if (borrower.userId?.displayName) {
      return borrower.userId.displayName;
    }
    return 'Library Member';
  };

  return (
    <>
      {/* Front Side - Organization Info (Print Only) */}
      <Card className="hidden print:block print:w-[85.6mm] print:h-[54mm] print:break-after-page print:shadow-none print:border-0 print:m-0 print:rounded-none">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-full flex flex-col items-center justify-center p-3 print:p-2">
          {/* Logo */}
          {tenant?.brandInfo?.logoUrl ? (
            <div className="mb-2 relative w-16 h-16">
              <Image
                src={tenant.brandInfo.logoUrl}
                alt="Organization Logo"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <IconComponent name="BookOpen" className="w-12 h-12 mb-2" />
          )}

          {/* Organization Name */}
          <h1 className="text-base font-bold text-center mb-1 leading-tight">
            {tenant?.brandInfo?.title || getLocalizedText(tenant?.displayName) || 'University Library'}
          </h1>

          {/* Subtitle */}
          {tenant?.brandInfo?.subTitle && (
            <p className="text-xs text-center opacity-90 mb-1">{tenant.brandInfo.subTitle}</p>
          )}

          <p className="text-xs text-center opacity-90 mb-2">Library Borrower Card</p>

          {/* Contact Information */}
          <div className="text-[8px] text-center opacity-80 mt-auto space-y-0.5">
            {tenant?.contact?.address && (
              <p className="line-clamp-2">{tenant.contact.address}</p>
            )}
            {tenant?.contact?.phoneNo && (
              <p>Tel: {tenant.contact.phoneNo}</p>
            )}
            {tenant?.contact?.email && (
              <p>{tenant.contact.email}</p>
            )}
            {tenant?.contact?.webSiteUrl && (
              <p className="truncate">{tenant.contact.webSiteUrl}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Back Side - Borrower Information */}
      <Card className="w-full max-w-md mx-auto overflow-hidden border-0 shadow-lg print:max-w-none print:shadow-none print:w-[85.6mm] print:h-[54mm] print:m-0 print:rounded-none">
        {/* Card Header with gradient background - no top margin, proper padding */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 print:p-1.5">
        <div className="flex items-start justify-between mb-4 print:mb-0.5">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 print:text-sm print:mb-0">
              {getDisplayName()}
            </h2>
            <div className="text-sm opacity-90 space-y-1 print:text-[10px] print:space-y-0">
              {borrower.batchId?.name && (
                <p>{borrower.batchId.name}</p>
              )}
              {borrower.email && (
                <p className="print:hidden">{borrower.email}</p>
              )}
            </div>
          </div>
          <div className="ml-3 print:ml-1">
            <IconComponent name="BookOpen" className="w-8 h-8 print:w-4 print:h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2 print:flex-row print:items-center print:gap-1 print:text-[7px]">
          <div className="flex items-center gap-2 print:gap-1">
            <div className="print:scale-75 print:origin-left">
              {getStatusBadge()}
            </div>
            <div className="print:scale-75 print:origin-left">
              {getBorrowerTypeBadge()}
            </div>
          </div>
          <div className="hidden print:flex print:text-[7px] print:ml-1">
            <span>Valid: {formatDate(borrower.membershipStartDate)} - {formatDate(borrower.membershipEndDate)}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6 print:p-1.5 print:space-y-1">
        {/* QR Code / Barcode Section */}
        <div className="flex flex-col items-center print:flex-col print:items-center">
          {/* QR Code - Hidden in print */}
          <div className="bg-white p-2 rounded-lg shadow-md print:hidden">
            {qrError ? (
              <div className="w-[150px] h-[150px] flex items-center justify-center text-destructive">
                <IconComponent name="AlertCircle" className="w-12 h-12" />
              </div>
            ) : (
              <canvas ref={canvasRef} />
            )}
          </div>

          {/* Barcode - Shown only in print */}
          <div className="absolute -left-[9999px] print:static print:mb-1">
            <div className="text-center">
              <div className="barcode-font" style={{ fontFamily: 'IDAutomationC39S', fontSize: '12px', letterSpacing: '0', color: 'black' }}>
                *{borrower.libraryCardNumber}*
              </div>
            </div>
          </div>

          <div>
            <p className="mt-3 text-lg font-semibold tracking-wider print:mt-0 print:text-xs text-center">
              {borrower.libraryCardNumber}
            </p>
            <p className="text-xs text-muted-foreground print:text-[8px] text-center">Library Card Number</p>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Membership Details */}
            <div className="border-t pt-4 space-y-3 print:border-t-0 print:pt-0 print:space-y-0">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase print:hidden">
                Membership Details
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm print:grid-cols-2 print:gap-1 print:text-[9px]">
                <div>
                  <p className="text-muted-foreground">Valid From</p>
                  <p className="font-medium">{formatDate(borrower.membershipStartDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valid Until</p>
                  <p className="font-medium">{formatDate(borrower.membershipEndDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 print:hidden">
                {borrower.isMembershipValid ? (
                  <Badge variant="default" className="bg-success">
                    <IconComponent name="CheckCircle" className="w-3 h-3 mr-1" />
                    Valid Membership
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <IconComponent name="XCircle" className="w-3 h-3 mr-1" />
                    Expired Membership
                  </Badge>
                )}
                {borrower.canBorrow ? (
                  <Badge variant="default">Can Borrow</Badge>
                ) : (
                  <Badge variant="secondary">Cannot Borrow</Badge>
                )}
              </div>
            </div>

            {/* Borrowing Statistics */}
            <div className="border-t pt-4 space-y-3 print:hidden">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                Borrowing Statistics
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{borrower.currentlyBorrowed}</p>
                  <p className="text-xs text-muted-foreground">Currently Borrowed</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-2xl font-bold">{borrower.totalBorrowed}</p>
                  <p className="text-xs text-muted-foreground">Total Borrowed</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className={`text-2xl font-bold ${borrower.overdueCount > 0 ? 'text-destructive' : ''}`}>
                    {borrower.overdueCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>

            {/* Fines Section */}
            {(borrower.totalFines > 0 || borrower.unpaidFines > 0) && (
              <div className="border-t pt-4 space-y-3 print:hidden">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  Fines
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-lg font-bold">{borrower.totalFines} MMK</p>
                    <p className="text-xs text-muted-foreground">Total Fines</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className={`text-lg font-bold ${borrower.unpaidFines > 0 ? 'text-destructive' : 'text-success'}`}>
                      {borrower.unpaidFines} MMK
                    </p>
                    <p className="text-xs text-muted-foreground">Unpaid Fines</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Note */}
        <div className="border-t pt-4 text-center print:hidden">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <IconComponent name="Shield" className="w-3 h-3" />
            Present this QR code at the library counter
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
