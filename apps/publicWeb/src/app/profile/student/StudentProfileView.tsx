"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, Printer, Download, User as UserIcon, ArrowLeft, Edit } from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { User } from "@repo/types";
import { Button } from "@repo/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getMyProfile, getProfilePhotoUrl, type StudentProfileData } from "./actions";

interface StudentProfileViewProps {
  user: User;
  tenantName: string;
  tenantSlug: string;
  tenantRootDomain: string;
  tenantLogo?: string;
  tenantDisplayName?: string;
}

export function StudentProfileView({ user, tenantName, tenantSlug, tenantRootDomain, tenantLogo, tenantDisplayName }: StudentProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const result = await getMyProfile();

        if (result.success && result.data) {
          setProfile(result.data);

          console.log('📸 [PROFILE PHOTO DEBUG] Profile data:', {
            hasProfilePhoto: !!result.data.profilePhoto,
            profilePhotoValue: result.data.profilePhoto,
            tenantId: user.tenantId,
            tenantSlug,
            tenantRootDomain,
          });

          // Generate QR code with record ID (slug)
          if (result.data.slug) {
            const qrUrl = await QRCode.toDataURL(result.data.slug, {
              width: 200,
              margin: 1,
            });
            setQrCodeUrl(qrUrl);
          }

          // Get signed URL for profile photo if it exists
          if (result.data.profilePhoto && user.tenantId && tenantSlug && tenantRootDomain) {
            try {
              setIsLoadingPhoto(true);
              console.log('📸 [PROFILE PHOTO DEBUG] Fetching signed URL...');
              const photoResult = await getProfilePhotoUrl({
                s3Key: result.data.profilePhoto,
                tenantId: user.tenantId,
                tenantSlug,
                tenantRootDomain,
              });

              console.log('📸 [PROFILE PHOTO DEBUG] Photo result:', {
                success: photoResult.success,
                hasSignedUrl: !!photoResult.signedUrl,
                signedUrl: photoResult.signedUrl,
              });

              if (photoResult.success && photoResult.signedUrl) {
                setProfilePhotoUrl(photoResult.signedUrl);
                console.log('✅ [PROFILE PHOTO DEBUG] Photo URL set successfully');
              } else {
                console.warn('⚠️ [PROFILE PHOTO DEBUG] No signed URL in response');
              }
            } catch (photoErr) {
              console.error("❌ [PROFILE PHOTO DEBUG] Error fetching profile photo:", photoErr);
              // Don't fail the whole page if photo fails to load
            } finally {
              setIsLoadingPhoto(false);
            }
          } else {
            console.log('⚠️ [PROFILE PHOTO DEBUG] Missing required data:', {
              hasProfilePhoto: !!result.data.profilePhoto,
              hasTenantId: !!user.tenantId,
              hasTenantSlug: !!tenantSlug,
              hasTenantRootDomain: !!tenantRootDomain,
            });
          }
        } else {
          setError(result.error || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [user.tenantId, tenantSlug, tenantRootDomain]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!contentRef.current || !profile) return;

    try {
      setIsDownloading(true);

      // Add a temporary style tag to override all colors with fallback RGB values
      const styleElement = document.createElement('style');
      styleElement.id = 'pdf-color-override';
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
        .pdf-export-mode .border-gray-200 {
          border-color: rgb(229, 231, 235) !important;
        }
        .pdf-export-mode .border-gray-300 {
          border-color: rgb(209, 213, 219) !important;
        }
        .pdf-export-mode .text-green-600 {
          color: rgb(22, 163, 74) !important;
        }
        .pdf-export-mode .text-gray-400 {
          color: rgb(156, 163, 175) !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Add temporary class to content
      const originalClasses = contentRef.current.className;
      contentRef.current.className = `${originalClasses} pdf-export-mode`;

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get all sections with page-break-after class
      const sections = contentRef.current.querySelectorAll('section');

      // Create PDF with proper margins
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 10; // 10mm margin on all sides
      const contentWidth = pageWidth - (margin * 2); // 190mm
      const maxContentHeight = pageHeight - (margin * 2); // 277mm usable height

      // Capture header first (to reuse on all pages)
      const headerElement = contentRef.current.querySelector('.flex.justify-between.items-start.mb-8');
      let headerCanvas = null;
      let headerImgHeight = 0;
      let headerImgData = '';

      if (headerElement) {
        headerCanvas = await html2canvas(headerElement as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        headerImgHeight = (headerCanvas.height * contentWidth) / headerCanvas.width;
        headerImgData = headerCanvas.toDataURL('image/jpeg', 0.95);

        // Add header to first page
        pdf.addImage(headerImgData, 'JPEG', margin, margin, contentWidth, headerImgHeight);
      }

      // Capture each section separately and add to appropriate page
      let isFirstSection = true;
      let currentY = margin + headerImgHeight + 5; // Start position after header

      for (const section of sections) {
        const canvas = await html2canvas(section as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (!isFirstSection) {
          // Add new page
          pdf.addPage();
          currentY = margin;
          // Don't add header on subsequent pages - only on first page
        }

        // Check if content fits on current page, if not scale it down
        // Add extra bottom padding (10mm) to prevent text cutoff at the bottom
        const availableHeight = pageHeight - currentY - margin - 10;
        let finalImgHeight = imgHeight;
        let finalContentWidth = contentWidth;

        if (imgHeight > availableHeight) {
          // Scale down to fit within available space
          const scaleFactor = availableHeight / imgHeight;
          finalImgHeight = availableHeight;
          finalContentWidth = contentWidth * scaleFactor;
        }

        // Add section content
        pdf.addImage(imgData, 'JPEG', margin, currentY, finalContentWidth, finalImgHeight);
        currentY += finalImgHeight;

        isFirstSection = false;
      }

      // Remove temporary class and style
      contentRef.current.className = originalClasses;
      document.head.removeChild(styleElement);

      // Save the PDF
      pdf.save(`${profile.slug}.pdf`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      console.error("Error details:", err.message, err.stack);
      alert(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date of birth
  const formatDateOfBirth = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Check if guardian is same as father
  const isGuardianSameAsFather = () => {
    if (!profile?.guardian || !profile?.father) return false;
    return (
      profile.guardian.nameMyanmar === profile.father.nameMyanmar &&
      profile.guardian.nameEnglish === profile.father.nameEnglish &&
      profile.guardian.nrcNumber === profile.father.nrcNumber
    );
  };

  // Check if guardian is same as mother
  const isGuardianSameAsMother = () => {
    if (!profile?.guardian || !profile?.mother) return false;
    return (
      profile.guardian.nameMyanmar === profile.mother.nameMyanmar &&
      profile.guardian.nameEnglish === profile.mother.nameEnglish &&
      profile.guardian.nrcNumber === profile.mother.nrcNumber
    );
  };

  // Check if current address is same as permanent address
  const isSameAddress = () => {
    if (!profile?.permanentAddress || !profile?.currentAddress) return false;
    return profile.permanentAddress.trim() === profile.currentAddress.trim();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#4C67E1] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#19184A] mb-2">
            Loading Profile
          </h2>
          <p className="text-gray-600">
            Please wait while we retrieve your student profile...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-[#FF6954] mb-4">Error</h2>
          <p className="text-gray-600">
            {error || "Unable to load your profile"}
          </p>
        </div>
      </div>
    );
  }

  // Simple dots pattern (clean and professional)
  const backgroundPattern = `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.15'/%3E%3C/svg%3E`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#e8f0fa" }}>
      {/* Blue Header with pattern - Hidden on print */}
      <header
        className="no-print relative z-50"
        style={{
          backgroundColor: "#2460B9",
          backgroundImage: `url("${backgroundPattern}")`,
          backgroundRepeat: "repeat",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              {tenantLogo && (
                <div className="relative h-12 w-12">
                  <Image
                    src={tenantLogo}
                    alt={tenantDisplayName || "Organization Logo"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="text-white">
                <h1 className="text-xl font-semibold">
                  {tenantDisplayName || tenantName}
                </h1>
                <p className="text-sm text-blue-100">Student Profile</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {profile?.registrationStatus === 'pending' && (
                <Button
                  onClick={() => router.push('/profileSetup/student')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-white border-amber-400/50"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Printable Content */}
      <div ref={contentRef} className="max-w-4xl mx-auto p-8 bg-white my-8 shadow-lg print:shadow-none print:my-0">
        {/* Header with Profile Photo and QR Code */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
          {/* Left: QR Code */}
          {qrCodeUrl && (
            <div className="text-center">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
              <p className="text-xs text-gray-500 mt-1">Scan for Record ID</p>
            </div>
          )}

          {/* Center: Student Info */}
          <div className="flex-1 mx-8">
            <h1 className="text-2xl font-bold text-[#19184A] mb-2">
              Student Registration Profile
            </h1>
            <p className="text-sm text-gray-600">
              Record ID: <span className="font-semibold">{profile.slug}</span>
            </p>
            <p className="text-sm text-gray-600">
              Submitted: {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.registrationStatus === 'pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : profile.registrationStatus === 'approved'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : profile.registrationStatus === 'rejected'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}>
                {profile.registrationStatus === 'pending' && '⏳'}
                {profile.registrationStatus === 'approved' && '✓'}
                {profile.registrationStatus === 'rejected' && '✗'}
                <span className="capitalize">{profile.registrationStatus}</span>
              </span>
            </div>
          </div>

          {/* Right: Profile Photo */}
          <div className="flex flex-col items-center">
            {isLoadingPhoto ? (
              <div className="w-32 h-32 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#4C67E1] mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Loading...</p>
                </div>
              </div>
            ) : profilePhotoUrl ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50">
                <Image
                  src={profilePhotoUrl}
                  alt="Student Profile Photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center">
                <UserIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {isLoadingPhoto ? "Loading Photo..." : "Student Photo"}
            </p>
          </div>
        </div>

        {/* PAGE 1: Personal, Contact & Address Information Combined */}
        <section className="mb-6 pb-8 page-break-after">
          <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
            Personal Information / ကိုယ်ရေးအချက်အလက်
          </h2>

          {/* Personal Details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500">Name (Myanmar)</p>
              <p className="font-medium text-sm">{profile.nameMyanmar}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Name (English)</p>
              <p className="font-medium text-sm">{profile.nameEnglish}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-medium text-sm">{profile.gender}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-medium text-sm">{formatDateOfBirth(profile.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Place of Birth</p>
              <p className="font-medium text-sm">{profile.placeOfBirth}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">NRC Number</p>
              <p className="font-medium text-sm">{profile.nrcNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ethnicity</p>
              <p className="font-medium text-sm">{profile.ethnicity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Religion</p>
              <p className="font-medium text-sm">{profile.religion}</p>
            </div>
            {profile.bloodGroup && (
              <div>
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="font-medium text-sm">{profile.bloodGroup}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <h3 className="text-md font-semibold text-[#19184A] mb-3 mt-4 pb-1 border-b border-gray-200">
            Contact Information / ဆက်သွယ်ရန်
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 leading-relaxed">Phone Number</p>
              <p className="font-medium text-sm leading-relaxed">{profile.phoneNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-relaxed">Email</p>
              <p className="font-medium text-sm leading-relaxed break-all">{profile.email}</p>
            </div>
          </div>

          {/* Address Details */}
          <h3 className="text-md font-semibold text-[#19184A] mb-3 mt-4 pb-1 border-b border-gray-200">
            Address Information / နေရပ်လိပ်စာ
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500">State/Region</p>
              <p className="font-medium text-sm">{profile.stateRegionName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">District</p>
              <p className="font-medium text-sm">{profile.districtName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Township</p>
              <p className="font-medium text-sm">{profile.townshipName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Town</p>
              <p className="font-medium text-sm">{profile.townName}</p>
            </div>
            {profile.wardVillageName && (
              <div>
                <p className="text-xs text-gray-500">Ward/Village</p>
                <p className="font-medium text-sm">{profile.wardVillageName}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">
                {isSameAddress() ? "Address" : "Permanent Address"}
              </p>
              <p className="font-medium text-sm">{profile.permanentAddress}</p>
            </div>
            {!isSameAddress() && (
              <div>
                <p className="text-xs text-gray-500">Current Address</p>
                <p className="font-medium text-sm">{profile.currentAddress}</p>
              </div>
            )}
          </div>
        </section>

        {/* PAGE 2: Current Academic & Previous Education */}
        <section className="mb-6 pb-8 page-break-after">
          {/* Current Academic - Batch Information */}
          {profile.batches && profile.batches.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Current Academic / လက်ရှိပညာရေး
              </h2>
              {profile.batches.map((batch, index) => {
                // Handle batch name - it might be an object or string
                const getBatchName = () => {
                  if (typeof batch.batchId === 'object' && batch.batchId !== null) {
                    return batch.batchId.name;
                  }
                  return batch.batchId;
                };

                // Handle academic year name - it might be an object or string
                const getAcademicYearName = () => {
                  if (typeof batch.academicYearId === 'object' && batch.academicYearId !== null) {
                    return batch.academicYearId.name;
                  }
                  return null;
                };

                const batchName = getBatchName();
                const academicYearName = getAcademicYearName();

                return (
                  <div key={batch._id} className={index > 0 ? "mt-3 pt-3 border-t border-gray-200" : ""}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="font-medium text-sm">{batchName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Roll Number</p>
                        <p className="font-medium text-sm">{batch.rollNo}</p>
                      </div>
                      {academicYearName && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500">Academic Year</p>
                          <p className="font-medium text-sm">{academicYearName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Previous Education */}
          {profile.previousEducation && profile.previousEducation.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Previous Education / ယခင်ပညာရေး
              </h2>
              {profile.previousEducation.map((edu, index) => (
                <div key={edu._id} className={index > 0 ? "mt-5 pt-5 border-t border-gray-200" : ""}>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Class</p>
                      <p className="font-medium text-sm">{edu.className}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Roll Number</p>
                      <p className="font-medium text-sm">{edu.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Exam Board</p>
                      <p className="font-medium text-sm">{edu.examBoard}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Year</p>
                      <p className="font-medium text-sm">{edu.year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Marks</p>
                      <p className="font-medium text-sm">{edu.totalMarks}</p>
                    </div>
                  </div>

                  {/* Subjects Table */}
                  {edu.subjects && edu.subjects.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Subjects / ဘာသာရပ်များ</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">#</th>
                              <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">Subject</th>
                              <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">Mark</th>
                              <th className="px-3 py-1.5 text-left text-xs font-medium text-gray-700 border-b">Distinction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {edu.subjects.map((subject, idx) => {
                              // Handle subject name - it might be an object or string
                              const getSubjectName = () => {
                                if (typeof subject.name === 'object' && subject.name !== null) {
                                  return subject.name.name;
                                }
                                if (typeof subject.name === 'string') {
                                  return subject.name;
                                }
                                if (typeof subject.subjectId === 'object' && subject.subjectId !== null) {
                                  return subject.subjectId.name;
                                }
                                return subject.subjectId;
                              };

                              return (
                                <tr key={subject._id} className="border-b">
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
              ))}
            </div>
          )}
        </section>

        {/* PAGE 3: Family Information & Additional Information */}
        <section className="mb-6 pb-8">
          {/* Family Information */}
          {(profile.father || profile.mother || profile.guardian) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Family Information / မိသားစုအချက်အလက်
              </h2>

              {/* Father - Hide if same as guardian */}
              {profile.father && !isGuardianSameAsFather() && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">Father / အဖ</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{profile.father.nameMyanmar}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{profile.father.nameEnglish}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{profile.father.nrcNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{profile.father.occupation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mother - Hide if same as guardian */}
              {profile.mother && !isGuardianSameAsMother() && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">Mother / အမိ</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{profile.mother.nameMyanmar}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{profile.mother.nameEnglish}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{profile.mother.nrcNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{profile.mother.occupation}</p>
                    </div>
                  </div>
                </div>
              )}

              {profile.guardian && (
                <div className="pb-2">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">Guardian / အုပ်ထိန်းသူ</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name (Myanmar)</p>
                      <p className="font-medium text-sm">{profile.guardian.nameMyanmar}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name (English)</p>
                      <p className="font-medium text-sm">{profile.guardian.nameEnglish}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NRC Number</p>
                      <p className="font-medium text-sm">{profile.guardian.nrcNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Occupation</p>
                      <p className="font-medium text-sm">{profile.guardian.occupation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Relationship</p>
                      <p className="font-medium text-sm">{profile.guardian.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="font-medium text-sm">{profile.guardian.phoneNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-sm">{profile.guardian.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-sm">{profile.guardian.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Information */}
          {(profile.hobbies || profile.skills || profile.disabilities || profile.medicalConditions || profile.specialRequirements) && (
            <div>
              <h2 className="text-lg font-bold text-[#19184A] mb-4 pb-2 border-b border-gray-200">
                Additional Information / နောက်ထပ်အချက်အလက်
              </h2>
              <div className="space-y-3">
                {profile.hobbies && (
                  <div>
                    <p className="text-xs text-gray-500">Hobbies</p>
                    <p className="font-medium text-sm">{profile.hobbies}</p>
                  </div>
                )}
                {profile.skills && (
                  <div>
                    <p className="text-xs text-gray-500">Skills</p>
                    <p className="font-medium text-sm">{profile.skills}</p>
                  </div>
                )}
                {profile.disabilities && (
                  <div>
                    <p className="text-xs text-gray-500">Disabilities</p>
                    <p className="font-medium text-sm">{profile.disabilities}</p>
                  </div>
                )}
                {profile.medicalConditions && (
                  <div>
                    <p className="text-xs text-gray-500">Medical Conditions</p>
                    <p className="font-medium text-sm">{profile.medicalConditions}</p>
                  </div>
                )}
                {profile.specialRequirements && (
                  <div>
                    <p className="text-xs text-gray-500">Special Requirements</p>
                    <p className="font-medium text-sm">{profile.specialRequirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This is an official registration document. Please keep it for your records.</p>
          <p className="mt-1">ဤစာရွက်စာတမ်းသည် တရားဝင်စာရင်းသွင်းမှုစာရွက်စာတမ်းဖြစ်ပါသည်။ သိမ်းဆည်းထားရှိပါ။</p>
        </div>
      </div>

      {/* Edit Notice - Hidden on print */}
      {profile.registrationStatus === 'pending' && (
        <div className="no-print max-w-4xl mx-auto mb-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Edit className="h-5 w-5 text-amber-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Profile Pending Review
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Your registration is currently under review. You can still edit your profile information
                    by clicking the <strong>"Edit Profile"</strong> button in the header above.
                  </p>
                  <p className="mt-1 text-xs">
                    မှတ်ချက်: သင့်မှတ်ပုံတင်ခြင်းကို လက်ရှိ စစ်ဆေးနေပါသည်။ အထက်ခေါင်းစီးရှိ <strong>"Edit Profile"</strong> ခလုတ်ကို နှိပ်၍ သင့်ကိုယ်ရေးအချက်အလက်များကို ပြင်ဆင်နိုင်ပါသေးသည်။
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/profileSetup/student')}
                size="sm"
                className="ml-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Edit Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:my-0 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
