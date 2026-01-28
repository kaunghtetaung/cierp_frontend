"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Briefcase,
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Play,
  X,
} from "lucide-react";

const YOUTUBE_VIDEO_ID = "Y59iV2Scoxg";

const registrationTypes = [
  {
    title: "Student Registration",
    description:
      "For new and returning students to register for courses and access campus services.",
    href: "/manual/register/student",
    icon: GraduationCap,
    features: [
      "Course enrollment",
      "Library access",
      "Grade viewing",
      "Fee payment",
    ],
  },
  {
    title: "Staff Registration",
    description:
      "For faculty and administrative staff to set up their campus portal accounts.",
    href: "/manual/register/staff",
    icon: Briefcase,
    features: [
      "HR portal access",
      "Class management",
      "Student records",
      "Resource booking",
    ],
  },
];

export default function RegisterManualPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Section with medical pattern */}
        <div className="medical-pattern-bg text-white">
          <div className="container mx-auto px-4 py-16">
            <nav className="mb-8">
              <Link
                href="/manual"
                className="text-white/80 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Manual
              </Link>
            </nav>
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Campus Portal Registration System
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                A comprehensive guide to registering and getting started with the
                Campus Portal. Watch the introduction video and discover the
                advantages of our digital registration system.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Video Thumbnail Section */}
          <section className="mb-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Introduction Video
              </h2>

              {/* YouTube Thumbnail with Play Button */}
              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl group cursor-pointer"
              >
                {/* Thumbnail Image */}
                <Image
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Campus Portal Registration Introduction"
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 896px"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Video Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white font-medium text-lg">
                    Watch: Campus Portal Registration Guide
                  </p>
                </div>
              </button>

              <p className="text-center text-muted-foreground mt-4">
                Click to watch the video and learn how the Campus Portal registration
                system works.
              </p>
            </div>
          </section>

          {/* Registration Types Section */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
              Choose Your Registration Type
            </h2>
            <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              Select the appropriate registration guide based on your role at the
              campus.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {registrationTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Link
                    key={type.href}
                    href={type.href}
                    className="group block p-8 bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-4 bg-[var(--color-nav-bg)] rounded-xl">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {type.title}
                        </h3>
                        <p className="text-muted-foreground mt-1">{type.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {type.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center text-primary font-medium">
                      View Guide
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Quick Steps Section */}
          <section className="mb-16">
            <div className="max-w-4xl mx-auto medical-pattern-bg rounded-2xl p-8 md:p-12 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
                Registration Process Overview
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Create Account", desc: "Sign up with your email" },
                  { step: "2", title: "Verify Email", desc: "Confirm your identity" },
                  { step: "3", title: "Complete Profile", desc: "Add your information" },
                  { step: "4", title: "Start Using", desc: "Access all services" },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-white/80">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section className="text-center">
            <p className="text-muted-foreground mb-4">
              Having trouble with registration?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/manual"
                className="px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Back to Manual
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
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
              className="absolute -top-12 right-0 text-white hover:text-white/80 transition-colors flex items-center gap-2"
            >
              <span className="text-sm">Close</span>
              <X className="w-6 h-6" />
            </button>

            {/* Video iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
              title="Campus Portal Registration Introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
