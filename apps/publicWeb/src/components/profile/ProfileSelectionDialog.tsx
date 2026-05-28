"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GraduationCap, Briefcase, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui";
import { useActiveThemeClass } from "@/hooks/use-active-theme-class";

interface ProfileSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

/**
 * Profile-role selector popup shown to guest users who haven't yet
 * filled their student / staff / alumni record.
 *
 * Lifted out of the default-theme `UserMenu` so per-tenant header
 * variants (um1sf, etc.) can mount it too. Colours come from the
 * active theme's CSS variables (`--color-primary`,
 * `--color-primary-foreground`) — see `useActiveThemeClass` for how
 * we keep the variable scope alive across the Radix portal jump to
 * `<body>` (otherwise the dialog would render in the default
 * theme's palette regardless of tenant).
 */
export function ProfileSelectionDialog({
  open,
  onOpenChange,
  user,
}: ProfileSelectionDialogProps) {
  const router = useRouter();
  const currentLanguage = Cookies.get("x-lang") || "en";
  const themeClass = useActiveThemeClass();

  // Brand colour expressions. `color-mix` lets us derive a darker
  // shade for the header gradient end-stop without baking in a
  // second tenant-specific colour token — keeps the dialog working
  // on any theme that only ships `--color-primary`.
  const primary = "var(--color-primary, #2460B9)";
  const primaryDeep =
    "color-mix(in srgb, var(--color-primary, #2460B9) 70%, black)";
  const primarySoft =
    "color-mix(in srgb, var(--color-primary, #2460B9) 14%, transparent)";
  const primaryForeground = "var(--color-primary-foreground, #FFFFFF)";

  const handleSelection = (type: "student" | "staff" | "alumni") => {
    // Student & Staff self-registration are both live. Alumni is the
    // only path still pending — keep the toast for it.
    if (type === "student" || type === "staff") {
      onOpenChange(false);
      router.push(`/profileSetup/${type}`);
      return;
    }
    const { toast } = require("sonner");
    const messages: Record<"alumni", { en: string; mm: string }> = {
      alumni: {
        en: "Alumni registration is coming soon!",
        mm: "ကျောင်းဟောင်းမှတ်ပုံတင်ခြင်းကို မကြာမီ ရရှိနိုင်ပါမည်!",
      },
    };
    const message =
      messages[type][currentLanguage as "en" | "mm"] || messages[type].en;
    toast.info("Coming Soon", { description: message });
  };

  const texts = {
    en: {
      title: "Complete Your Profile",
      description: "Please select your role to complete registration",
      helper:
        "Your account is currently registered as a Guest user. To access full features and services, please complete your profile by selecting your appropriate role below.",
      student: {
        title: "Student",
        description:
          "Register as a student for courses and academic resources",
        cta: "Continue",
      },
      staff: {
        title: "Staff",
        description:
          "Register as staff to manage courses and resources",
        cta: "Continue",
      },
      alumni: {
        title: "Alumni",
        description:
          "Register as alumni to stay connected with the university",
        cta: "Continue",
      },
      comingSoon: "Coming Soon",
      footer: "You can update your profile settings later",
    },
    mm: {
      title: "သင့်ကိုယ်ရေးအချက်အလက် ဖြည့်သွင်းရန်",
      description: "မှတ်ပုံတင်ခြင်းပြီးမြောက်ရန် သင့်အခန်းကဏ္ဍကို ရွေးချယ်ပါ",
      helper:
        "သင့်အကောင့်ကို Guest အသုံးပြုသူအဖြစ် မှတ်ပုံတင်ထားပါသည်။ အင်္ဂါရပ်များနှင့် ဝန်ဆောင်မှုများ အပြည့်အဝ အသုံးပြုနိုင်ရန် အောက်ပါတွင် သင့့်အခန်းကဏ္ဍကို ရွေးချယ်ပါ။",
      student: {
        title: "ကျောင်းသား/သူ",
        description: "သင်တန်းများနှင့် ပညာရေးအရင်းအမြစ်များအတွက် မှတ်ပုံတင်ရန်",
        cta: "ဆက်လက်လုပ်ဆောင်ရန်",
      },
      staff: {
        title: "ဝန်ထမ်း",
        description: "သင်တန်းများနှင့် အရင်းအမြစ်များ စီမံခန့်ခွဲရန်အတွက် မှတ်ပုံတင်ရန်",
        cta: "ဆက်လက်လုပ်ဆောင်ရန်",
      },
      alumni: {
        title: "ကျောင်းဟောင်း",
        description: "တက္ကသိုလ်နှင့် ဆက်သွယ်မှုရှိစေရန်အတွက် မှတ်ပုံတင်ရန်",
        cta: "ဆက်လက်လုပ်ဆောင်ရန်",
      },
      comingSoon: "မကြာမီရရှိမည်",
      footer: "သင့်ကိုယ်ရေးအချက်အလက်များကို နောက်မှ ပြင်ဆင်နိုင်ပါသည်",
    },
  } as const;

  const t = texts[currentLanguage as "en" | "mm"] || texts.en;

  const cardBase =
    "group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // `themeClass` re-establishes the theme CSS-variable scope after
        // the Radix portal pulls us out of the page's theme wrapper.
        className={`${themeClass} sm:max-w-3xl p-0 overflow-hidden bg-white border border-gray-200 shadow-lg`}
        showCloseButton={true}
      >
        <DialogHeader
          className="px-6 py-4"
          style={{
            backgroundImage: `linear-gradient(to right, ${primary}, ${primaryDeep})`,
            color: primaryForeground,
          }}
        >
          <DialogTitle
            className="text-xl font-bold text-center"
            style={{ color: primaryForeground }}
          >
            {t.title}
          </DialogTitle>
          <DialogDescription
            className="text-center text-sm mt-1"
            style={{ color: primaryForeground, opacity: 0.9 }}
          >
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          {user && (
            <div className="mb-6">
              <p className="text-sm text-gray-700 leading-relaxed text-center">
                {t.helper}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student — active */}
            <button
              type="button"
              onClick={() => handleSelection("student")}
              className={cardBase}
              style={
                {
                  // Inline custom prop fed to a Tailwind hover variant
                  // would be brittle; instead the icon + CTA carry the
                  // brand colour and the card hover is a soft tint.
                  ["--hover-border" as any]: primary,
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div className="mb-3 flex justify-center">
                <div
                  className="rounded-full p-3 shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, ${primary}, ${primaryDeep})`,
                  }}
                >
                  <GraduationCap
                    className="h-6 w-6"
                    style={{ color: primaryForeground }}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.student.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.student.description}
                </p>
                <div
                  className="text-xs font-medium"
                  style={{ color: primary }}
                >
                  {t.student.cta} →
                </div>
              </div>
            </button>

            {/* Staff — active. Phase 5 wired this to /profileSetup/staff. */}
            <button
              type="button"
              onClick={() => handleSelection("staff")}
              className={cardBase}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div className="mb-3 flex justify-center">
                <div
                  className="rounded-full p-3 shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, ${primary}, ${primaryDeep})`,
                  }}
                >
                  <Briefcase
                    className="h-6 w-6"
                    style={{ color: primaryForeground }}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.staff.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.staff.description}
                </p>
                <div
                  className="text-xs font-medium"
                  style={{ color: primary }}
                >
                  {t.staff.cta} →
                </div>
              </div>
            </button>

            {/* Alumni — coming soon */}
            <button
              type="button"
              onClick={() => handleSelection("alumni")}
              className={`${cardBase} opacity-75`}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              <div className="absolute top-2 right-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: primarySoft,
                    color: primary,
                  }}
                >
                  {t.comingSoon}
                </span>
              </div>
              <div className="mb-3 flex justify-center">
                <div
                  className="rounded-full p-3 shadow-md"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, ${primary}, ${primaryDeep})`,
                  }}
                >
                  <Users
                    className="h-6 w-6"
                    style={{ color: primaryForeground }}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.alumni.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.alumni.description}
                </p>
                <div
                  className="text-xs font-medium"
                  style={{ color: primary }}
                >
                  {t.comingSoon} →
                </div>
              </div>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">{t.footer}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileSelectionDialog;
