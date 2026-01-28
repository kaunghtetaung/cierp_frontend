"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Book,
  GraduationCap,
  Users,
  Shield,
  Clock,
  Smartphone,
  Globe,
  FileCheck,
  Bell,
  Database,
  Play,
  X,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const YOUTUBE_VIDEO_ID = "Y59iV2Scoxg";

const manualSections = [
  {
    title: "Library System",
    description: "Search books, manage reservations, and access digital resources.",
    href: "/manual/library",
    icon: Book,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500",
  },
  {
    title: "Student Registration",
    description: "New student registration, profile setup, and account activation.",
    href: "/manual/register/student",
    icon: GraduationCap,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500",
  },
  {
    title: "Staff Registration",
    description: "Staff portal registration and campus account setup guide.",
    href: "/manual/register/staff",
    icon: Users,
    color: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-500",
  },
];

const advantages = [
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Multi-factor authentication and encrypted data storage.",
  },
  {
    icon: Clock,
    title: "Quick Registration",
    description: "Complete registration in minutes with smart validation.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Access from any device with full functionality.",
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description: "Available in Myanmar and English languages.",
  },
  {
    icon: Users,
    title: "Unified Portal",
    description: "Single sign-on to all campus services.",
  },
  {
    icon: FileCheck,
    title: "Document Management",
    description: "Upload and manage documents digitally.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Instant updates on status and announcements.",
  },
  {
    icon: Database,
    title: "Centralized Data",
    description: "All records in one secure location.",
  },
];

export default function ManualPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="medical-pattern-bg text-white">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Campus Portal User Manual
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                Everything you need to know about using the Campus Portal effectively.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#F5F7FA]">
          <div className="container mx-auto px-4 py-10">
            {/* Two Column Layout with Equal Height */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Video Section - 7 columns */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          Introduction Video
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Learn how to use the Campus Portal
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* YouTube Thumbnail */}
                    <button
                      type="button"
                      onClick={() => setIsVideoOpen(true)}
                      className="relative w-full aspect-video rounded-xl overflow-hidden group cursor-pointer flex-1"
                    >
                      <Image
                        src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                        alt="Campus Portal Introduction"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 58vw"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                          <Play className="w-7 h-7 md:w-8 md:h-8 text-primary ml-1" fill="currentColor" />
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-semibold text-lg drop-shadow-lg">
                          Campus Portal User Guide
                        </p>
                        <p className="text-white/80 text-sm mt-1">
                          Click to watch • 5 min
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Sections - 5 columns */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Book className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          User Manuals
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Step-by-step guides for all features
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    {manualSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <Link
                          key={section.href}
                          href={section.href}
                          className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-gray-50/50 to-transparent hover:from-gray-50"
                        >
                          <div className={`flex-shrink-0 w-12 h-12 ${section.bgColor} rounded-xl flex items-center justify-center shadow-lg shadow-${section.bgColor}/30`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                              {section.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">
                              {section.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advantages Section */}
        <div className="bg-gradient-to-br from-[#1a4fa0] via-[#1F5CB7] to-[#2563eb]">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Why Use Campus Portal?
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Modern tools for efficient campus administration
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
              {advantages.map((advantage, index) => {
                const Icon = advantage.icon;
                return (
                  <div
                    key={index}
                    className="group p-4 md:p-5 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white text-sm md:text-base mb-1">
                      {advantage.title}
                    </h3>
                    <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                      {advantage.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-[#F5F7FA]">
          <div className="container mx-auto px-4 py-10">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Need Help?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Our support team is ready to assist you with any questions.
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex-shrink-0"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <span className="text-sm font-medium">Close</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </div>
            </button>

            {/* Video iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
              title="Campus Portal Introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
