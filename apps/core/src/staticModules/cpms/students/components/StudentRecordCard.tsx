"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Loader2,
  Printer,
  Download,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExtraActionModal } from "@/components/extraAction/ExtraActionModal";
import type { ExtraAction, ExtraActionForm } from "@repo/types";

interface StudentRecordCardProps {
  student: any;
  module: any;
  navigation?: {
    hasNext: boolean;
    hasPrevious: boolean;
    nextId?: string;
    previousId?: string;
    currentIndex?: number;
    totalRecords?: number;
  };
  appId: string;
}

export function StudentRecordCard({
  student,
  module,
  navigation,
  appId,
}: StudentRecordCardProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // Define the approve student action configuration
  // Using type assertion since ExtraAction type doesn't include successMessage/errorMessage
  // but ExtraActionModal uses them at runtime
  const approveStudentAction = {
    actionKey: "approve-student",
    type: "modal",
    label: { en: "Approve Student", mm: "ကျောင်းသားအတည်ပြုရန်" },
    successMessage: { en: "Student approved successfully", mm: "ကျောင်းသားအတည်ပြုပြီးပါပြီ" },
    errorMessage: { en: "Failed to approve student", mm: "ကျောင်းသားအတည်ပြုခြင်း မအောင်မြင်ပါ" },
  } as ExtraAction & { successMessage?: { en?: string; mm?: string }; errorMessage?: { en?: string; mm?: string } };

  const approveStudentActionForm: ExtraActionForm = {
    actionKey: "approve-student",
    formType: "modal",
    formApproach: "pre-built",
    formName: "approveStudentForm",
    title: { en: "Approve Student Registration", mm: "ကျောင်းသားမှတ်ပုံတင်ခြင်းအတည်ပြုရန်" },
    description: { en: "Review and approve the student's registration by assigning batch and roll number.", mm: "ကျောင်းသားမှတ်ပုံတင်ခြင်းကို အတန်းနှင့် ခုံနံပါတ်သတ်မှတ်ပြီး အတည်ပြုပါ။" },
    endpoint: "/cpms/students/:id/approve",
    method: "POST",
    formWidth: "xl",
  };

  // Generate QR code on mount
  useEffect(() => {
    async function generateQR() {
      if (student.slug || student.id) {
        const qrUrl = await QRCode.toDataURL(student.slug || student.id, {
          width: 200,
          margin: 1,
        });
        setQrCodeUrl(qrUrl);
      }
    }
    generateQR();
  }, [student.slug, student.id]);

  // Print handler - Print only the CV content
  const handlePrint = () => {
    if (!contentRef.current) return;

    const printContent = contentRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Record Card - ${student.nameEnglish || student.slug || student.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 1cm;
              background: white;
              color: #111827;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .record-header {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              margin-bottom: 2rem;
              padding-bottom: 1.5rem;
              border-bottom: 2px solid #d1d5db;
              page-break-inside: avoid;
            }
            .qr-section {
              flex-shrink: 0;
              text-align: center;
            }
            .info-section {
              flex: 1;
              margin: 0 2rem;
              text-align: left;
            }
            .photo-section {
              flex-shrink: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            h1 {
              font-size: 1.5rem;
              font-weight: bold;
              color: #19184A;
              margin-bottom: 0.5rem;
            }
            h2 {
              font-size: 1.125rem;
              font-weight: bold;
              color: #19184A;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #e5e7eb;
            }
            h3 {
              font-size: 1rem;
              font-weight: 600;
              color: #19184A;
              margin-bottom: 0.75rem;
              padding-bottom: 0.25rem;
              border-bottom: 1px solid #e5e7eb;
            }
            h4 {
              font-size: 0.875rem;
              font-weight: 600;
              color: #374151;
              margin-bottom: 0.75rem;
              background: #f9fafb;
              padding: 0.5rem;
              border-radius: 0.25rem;
            }
            p {
              margin: 0;
            }
            .text-xs {
              font-size: 0.75rem;
            }
            .text-sm {
              font-size: 0.875rem;
            }
            .text-gray-500 {
              color: #6b7280;
            }
            .text-gray-600 {
              color: #4b5563;
            }
            .font-medium {
              font-weight: 500;
            }
            .font-semibold {
              font-weight: 600;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, 1fr);
            }
            .grid-cols-3 {
              grid-template-columns: repeat(3, 1fr);
            }
            .grid-cols-4 {
              grid-template-columns: repeat(4, 1fr);
            }
            .gap-3 {
              gap: 0.75rem;
            }
            .gap-6 {
              gap: 1.5rem;
            }
            .mb-3 {
              margin-bottom: 0.75rem;
            }
            .mb-4 {
              margin-bottom: 1rem;
            }
            .mb-6 {
              margin-bottom: 1.5rem;
            }
            .mb-8 {
              margin-bottom: 2rem;
            }
            .mt-8 {
              margin-top: 2rem;
            }
            .pb-2 {
              padding-bottom: 0.5rem;
            }
            .pb-4 {
              padding-bottom: 1rem;
            }
            .pb-6 {
              padding-bottom: 1.5rem;
            }
            .pb-8 {
              padding-bottom: 2rem;
            }
            .pt-6 {
              padding-top: 1.5rem;
            }
            .border-b {
              border-bottom: 1px solid #e5e7eb;
            }
            .border-t {
              border-top: 1px solid #e5e7eb;
            }
            .border-gray-200 {
              border-color: #e5e7eb;
            }
            .rounded-lg {
              border-radius: 0.5rem;
            }
            .overflow-hidden {
              overflow: hidden;
            }
            .text-center {
              text-align: center;
            }
            .flex {
              display: flex;
            }
            .flex-col {
              flex-direction: column;
            }
            .flex-1 {
              flex: 1;
            }
            .items-center {
              align-items: center;
            }
            .justify-center {
              justify-content: center;
            }
            .mx-8 {
              margin-left: 2rem;
              margin-right: 2rem;
            }
            .col-span-2 {
              grid-column: span 2;
            }
            .col-span-3 {
              grid-column: span 3;
            }
            .col-span-4 {
              grid-column: span 4;
            }
            .w-32, .w-28 {
              width: 8rem;
            }
            .h-32, .h-28 {
              height: 8rem;
            }
            /* Photo container - handle Next.js Image */
            .photo-section > div {
              width: 128px !important;
              height: 128px !important;
              position: relative !important;
            }
            .photo-section img {
              width: 128px !important;
              height: 128px !important;
              object-fit: cover !important;
            }
            /* QR Code */
            .qr-section img {
              width: 128px !important;
              height: 128px !important;
            }
            .bg-gray-50 {
              background-color: #f9fafb;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.75rem;
            }
            th, td {
              padding: 0.375rem 0.75rem;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f9fafb;
              font-weight: 500;
              color: #374151;
            }
            .text-green-600 {
              color: #16a34a;
            }
            .text-gray-400 {
              color: #9ca3af;
            }
            .inline-flex {
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;
              padding: 0.125rem 0.625rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 500;
            }
            .bg-amber-100 {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fcd34d;
            }
            .bg-green-100 {
              background: #dcfce7;
              color: #166534;
              border: 1px solid #86efac;
            }
            .bg-red-100 {
              background: #fee2e2;
              color: #991b1b;
              border: 1px solid #fca5a5;
            }
            .bg-gray-100 {
              background: #f3f4f6;
              color: #1f2937;
              border: 1px solid #d1d5db;
            }
            section {
              margin-bottom: 1.5rem;
              padding-bottom: 2rem;
            }
            .page-break-after {
              page-break-after: always;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for images to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!contentRef.current || !student) return;

    try {
      setIsDownloading(true);

      // Add a temporary style tag to override all colors with fallback RGB values
      const styleElement = document.createElement("style");
      styleElement.id = "pdf-color-override";
      styleElement.innerHTML = `
        .pdf-export-mode * {
          color: rgb(17, 24, 39) !important;
          background-color: transparent !important;
          border-color: rgb(229, 231, 235) !important;
        }
        .pdf-export-mode h1, .pdf-export-mode h2, .pdf-export-mode h3 {
          color: rgb(25, 24, 74) !important;
        }
        .pdf-export-mode .text-gray-500 {
          color: rgb(107, 114, 128) !important;
        }
        .pdf-export-mode .text-gray-600 {
          color: rgb(75, 85, 99) !important;
        }
        .pdf-export-mode .text-gray-700 {
          color: rgb(55, 65, 81) !important;
        }
        .pdf-export-mode .bg-gray-50 {
          background-color: rgb(249, 250, 251) !important;
        }
        .pdf-export-mode .bg-white {
          background-color: rgb(255, 255, 255) !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Add temporary class to content
      const originalClasses = contentRef.current.className;
      contentRef.current.className = `${originalClasses} pdf-export-mode`;

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get all sections
      const sections = contentRef.current.querySelectorAll("section");

      // Create PDF with proper margins
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // Capture header first
      const headerElement = contentRef.current.querySelector(
        ".record-header"
      );
      let headerImgHeight = 0;

      if (headerElement) {
        const headerCanvas = await html2canvas(headerElement as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        headerImgHeight =
          (headerCanvas.height * contentWidth) / headerCanvas.width;
        const headerImgData = headerCanvas.toDataURL("image/jpeg", 0.95);

        pdf.addImage(
          headerImgData,
          "JPEG",
          margin,
          margin,
          contentWidth,
          headerImgHeight
        );
      }

      // Capture each section separately
      let isFirstSection = true;
      let currentY = margin + headerImgHeight + 5;

      for (const section of sections) {
        const canvas = await html2canvas(section as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (!isFirstSection) {
          pdf.addPage();
          currentY = margin;
        }

        const availableHeight = pageHeight - currentY - margin - 10;
        let finalImgHeight = imgHeight;
        let finalContentWidth = contentWidth;

        if (imgHeight > availableHeight) {
          const scaleFactor = availableHeight / imgHeight;
          finalImgHeight = availableHeight;
          finalContentWidth = contentWidth * scaleFactor;
        }

        pdf.addImage(
          imgData,
          "JPEG",
          margin,
          currentY,
          finalContentWidth,
          finalImgHeight
        );
        currentY += finalImgHeight;

        isFirstSection = false;
      }

      // Remove temporary class and style
      contentRef.current.className = originalClasses;
      document.head.removeChild(styleElement);

      // Save the PDF
      pdf.save(`${student.slug || student.id}.pdf`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert(`Failed to generate PDF: ${err.message || "Unknown error"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Check if guardian is same as father
  const isGuardianSameAsFather = () => {
    if (!student?.guardian || !student?.father) return false;
    return (
      student.guardian.nameMyanmar === student.father.nameMyanmar &&
      student.guardian.nameEnglish === student.father.nameEnglish
    );
  };

  // Check if guardian is same as mother
  const isGuardianSameAsMother = () => {
    if (!student?.guardian || !student?.mother) return false;
    return (
      student.guardian.nameMyanmar === student.mother.nameMyanmar &&
      student.guardian.nameEnglish === student.mother.nameEnglish
    );
  };

  // Check if current address is same as permanent address
  const isSameAddress = () => {
    if (!student?.permanentAddress || !student?.currentAddress) return false;
    return student.permanentAddress.trim() === student.currentAddress.trim();
  };

  return (
    <div className="w-full">
      {/* Action Bar - Hidden on print */}
      <div className="no-print flex items-center justify-between mb-6 pb-4 border-b">
        {/* Left: Back & Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${appId}/students`)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>

          {navigation && (
            <div className="flex items-center gap-2 pl-3 border-l">
              <Button
                variant="outline"
                size="sm"
                disabled={!navigation.hasPrevious}
                asChild={navigation.hasPrevious}
              >
                {navigation.hasPrevious && navigation.previousId ? (
                  <Link href={`/${appId}/students/${navigation.previousId}/view`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>

              {navigation.currentIndex !== undefined &&
                navigation.totalRecords !== undefined && (
                  <span className="text-sm text-muted-foreground px-2">
                    {navigation.currentIndex + 1} / {navigation.totalRecords}
                  </span>
                )}

              <Button
                variant="outline"
                size="sm"
                disabled={!navigation.hasNext}
                asChild={navigation.hasNext}
              >
                {navigation.hasNext && navigation.nextId ? (
                  <Link href={`/${appId}/students/${navigation.nextId}/view`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${appId}/students/${student.id}`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          {/* Approve Button - Only show for pending students */}
          {student.registrationStatus === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(true)}
              className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {isDownloading ? "Generating..." : "PDF"}
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable Content - Full Width with proper padding */}
      <div
        ref={contentRef}
        className="w-full bg-white p-6"
      >
        {/* Header with Profile Photo and QR Code - Row layout for print */}
        <div className="record-header flex flex-row justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
          {/* QR Code - Left */}
          {qrCodeUrl && (
            <div className="qr-section text-center flex-shrink-0">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32"
                style={{ width: '128px', height: '128px' }}
              />
              <p className="text-xs text-gray-500 mt-1">Scan for Record ID</p>
            </div>
          )}

          {/* Student Info - Center */}
          <div className="info-section flex-1 text-left mx-8">
            <h1 className="text-2xl font-bold text-[#19184A] mb-2">
              Student Record Card
            </h1>
            {student.medm && (
              <p className="text-sm text-gray-600">
                University Registration Number (MEDM):{" "}
                <span className="font-semibold">{student.medm}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Record ID: <span className="font-semibold">{student.slug || student.id}</span>
            </p>
            <p className="text-sm text-gray-600">
              Created: {formatDate(student.createdAt)}
            </p>
            {student.registrationStatus && (
              <div className="flex items-center justify-start gap-2 text-sm">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    student.registrationStatus === "pending"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : student.registrationStatus === "approved"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : student.registrationStatus === "rejected"
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-gray-100 text-gray-800 border border-gray-300"
                  }`}
                >
                  <span className="capitalize">{student.registrationStatus}</span>
                </span>
              </div>
            )}
          </div>

          {/* Profile Photo - Right */}
          <div className="photo-section flex flex-col items-center flex-shrink-0">
            {student.profilePhoto ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50" style={{ width: '128px', height: '128px' }}>
                <Image
                  src={student.profilePhoto}
                  alt="Student Profile Photo"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center" style={{ width: '128px', height: '128px' }}>
                <UserIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Student Photo</p>
          </div>
        </div>

        {/* PAGE 1: Personal Information, Contact & Address, Family Information */}
        <section className="mb-6 pb-8 page-break-after">
          {/* Personal Information */}
          <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
            Personal Information / ကိုယ်ရေးအချက်အလက်
          </h2>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500">Name (Myanmar)</p>
              <p className="font-medium text-sm">{student.nameMyanmar || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Name (English)</p>
              <p className="font-medium text-sm">{student.nameEnglish || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-medium text-sm">{student.gender || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-medium text-sm">{formatDate(student.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Place of Birth</p>
              <p className="font-medium text-sm">{student.placeOfBirth || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">NRC Number</p>
              <p className="font-medium text-sm">{student.nrcNumber || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Race</p>
              <p className="font-medium text-sm">{student.race || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Religion</p>
              <p className="font-medium text-sm">{student.religion || "-"}</p>
            </div>
            {student.bloodGroup && (
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="font-medium text-sm">{student.bloodGroup}</p>
              </div>
            )}
          </div>

          {/* Contact & Address Information */}
          <h3 className="text-md font-semibold text-[#19184A] mb-3 mt-8 pb-1 border-b border-gray-200">
            Contact & Address Information / ဆက်သွယ်ရန်နှင့် နေရပ်လိပ်စာ
          </h3>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="font-medium text-sm">{student.phoneNumber || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-sm break-all">{student.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">State/Region</p>
              <p className="font-medium text-sm">{student.stateRegionName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">District</p>
              <p className="font-medium text-sm">{student.districtName || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">Township</p>
              <p className="font-medium text-sm">{student.townshipName || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Town</p>
              <p className="font-medium text-sm">{student.townName || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            {student.wardVillageName && (
              <div>
                <p className="text-xs text-gray-500">Ward/Village</p>
                <p className="font-medium text-sm">{student.wardVillageName}</p>
              </div>
            )}
            <div className={student.wardVillageName ? "col-span-3" : "col-span-4"}>
              <p className="text-xs text-gray-500">
                {isSameAddress() ? "Address" : "Permanent Address"}
              </p>
              <p className="font-medium text-sm">{student.permanentAddress || "-"}</p>
            </div>
          </div>

          {!isSameAddress() && student.currentAddress && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">Current Address</p>
              <p className="font-medium text-sm">{student.currentAddress}</p>
            </div>
          )}

          {/* Family Information */}
          {(student.father || student.mother || student.guardian) && (
            <div className="mt-8">
              <h3 className="text-md font-semibold text-[#19184A] mb-3 pb-1 border-b border-gray-200">
                Family Information / မိသားစုအချက်အလက်
              </h3>

              {/* Father */}
              {student.father && !isGuardianSameAsFather() && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                    Father / အဖ
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{student.father.nameMyanmar || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{student.father.nameEnglish || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{student.father.nrcNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{student.father.occupation || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mother */}
              {student.mother && !isGuardianSameAsMother() && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                    Mother / အမိ
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{student.mother.nameMyanmar || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{student.mother.nameEnglish || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{student.mother.nrcNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{student.mother.occupation || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian */}
              {student.guardian && (
                <div className="pb-2">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                    Guardian / အုပ်ထိန်းသူ
                  </h4>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{student.guardian.nameMyanmar || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{student.guardian.nameEnglish || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{student.guardian.nrcNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{student.guardian.occupation || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Relationship</p>
                      <p className="font-medium text-sm">{student.guardian.relationship || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="font-medium text-sm">{student.guardian.phoneNumber || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-sm">{student.guardian.address || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* PAGE 2: Current Academic, Previous Education, Additional Information */}
        <section className="mb-6 pb-8">
          {/* Current Academic - Batch Information */}
          {student.batches && student.batches.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Current Academic / လက်ရှိပညာရေး
              </h2>

              {student.batches.map((batch: any, index: number) => {
                const getBatchName = () => {
                  if (typeof batch.batchId === "object" && batch.batchId !== null) {
                    return batch.batchId.name;
                  }
                  return batch.batchId;
                };

                const getAcademicYearName = () => {
                  if (typeof batch.academicYearId === "object" && batch.academicYearId !== null) {
                    return batch.academicYearId.name;
                  }
                  return null;
                };

                const batchName = getBatchName();
                const academicYearName = getAcademicYearName();

                return (
                  <div
                    key={batch._id || index}
                    className={index > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}
                  >
                    <div className="grid grid-cols-3 gap-3">
                      {academicYearName && (
                        <div>
                          <p className="text-xs text-gray-500">Academic Year</p>
                          <p className="font-medium text-sm">{academicYearName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="font-medium text-sm">{batchName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Roll Number</p>
                        <p className="font-medium text-sm">{batch.rollNo || "-"}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Previous Education */}
          {student.previousEducation && student.previousEducation.length > 0 && (
            <div className="mb-6 mt-8">
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Previous Education / ယခင်ပညာရေး
              </h2>
              {student.previousEducation.map((edu: any, index: number) => (
                <div
                  key={edu._id || index}
                  className={index > 0 ? "mt-5 pt-5 border-t border-gray-200" : ""}
                >
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column: Education Details */}
                    <div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Class</p>
                          <p className="font-medium text-sm">{edu.className || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Roll Number</p>
                          <p className="font-medium text-sm">{edu.rollNumber || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Exam Board</p>
                          <p className="font-medium text-sm">{edu.examBoard || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Year</p>
                          <p className="font-medium text-sm">{edu.year || "-"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Total Marks</p>
                          <p className="font-medium text-sm">{edu.totalMarks || "-"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Subjects Table */}
                    <div>
                      {edu.subjects && edu.subjects.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            Subjects / ဘာသာရပ်များ
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">
                                    #
                                  </th>
                                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">
                                    Subject
                                  </th>
                                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">
                                    Mark
                                  </th>
                                  <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">
                                    Distinction
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {edu.subjects.map((subject: any, idx: number) => {
                                  const getSubjectName = () => {
                                    if (typeof subject.name === "object" && subject.name !== null) {
                                      return subject.name.name;
                                    }
                                    if (typeof subject.name === "string") {
                                      return subject.name;
                                    }
                                    if (typeof subject.subjectId === "object" && subject.subjectId !== null) {
                                      return subject.subjectId.name;
                                    }
                                    return subject.subjectId;
                                  };

                                  return (
                                    <tr key={subject._id || idx} className="border-b">
                                      <td className="px-3 py-1.5 text-xs">{idx + 1}</td>
                                      <td className="px-3 py-1.5 text-xs">{getSubjectName()}</td>
                                      <td className="px-3 py-1.5 text-xs font-medium">{subject.mark}</td>
                                      <td className="px-3 py-1.5 text-xs">
                                        {subject.isDistinction ? (
                                          <span className="text-green-600 font-medium">✓</span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional Information */}
          {(student.hobbies ||
            student.skills ||
            student.disabilities ||
            student.medicalConditions ||
            student.specialRequirements) && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Additional Information / နောက်ထပ်အချက်အလက်
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {student.hobbies && (
                  <div>
                    <p className="text-xs text-gray-500">Hobbies</p>
                    <p className="font-medium text-sm">{student.hobbies}</p>
                  </div>
                )}
                {student.skills && (
                  <div>
                    <p className="text-xs text-gray-500">Skills</p>
                    <p className="font-medium text-sm">{student.skills}</p>
                  </div>
                )}
                {student.disabilities && (
                  <div>
                    <p className="text-xs text-gray-500">Disabilities</p>
                    <p className="font-medium text-sm">{student.disabilities}</p>
                  </div>
                )}
                {student.medicalConditions && (
                  <div>
                    <p className="text-xs text-gray-500">Medical Conditions</p>
                    <p className="font-medium text-sm">{student.medicalConditions}</p>
                  </div>
                )}
                {student.specialRequirements && (
                  <div>
                    <p className="text-xs text-gray-500">Special Requirements</p>
                    <p className="font-medium text-sm">{student.specialRequirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This is an official student record document. Please keep it for your records.</p>
          <p className="mt-1">
            ဤစာရွက်စာတမ်းသည် တရားဝင်ကျောင်းသားမှတ်တမ်းစာရွက်စာတမ်းဖြစ်ပါသည်။ သိမ်းဆည်းထားရှိပါ။
          </p>
        </div>
      </div>

      {/* No global print CSS needed - using new window approach */}

      {/* Approve Student Modal */}
      <ExtraActionModal
        action={approveStudentAction}
        actionForm={approveStudentActionForm}
        module={module}
        selectedItems={[student]}
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onSuccess={() => {
          setIsApproveModalOpen(false);
          router.refresh();
        }}
        currentLanguage="en"
        isRowAction={true}
      />
    </div>
  );
}
