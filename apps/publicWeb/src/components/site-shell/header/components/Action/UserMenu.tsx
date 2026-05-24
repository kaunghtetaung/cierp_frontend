import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/styled-components/ui/Button";
import {
  User,
  Settings,
  UserCircle,
  Lock,
  LogIn,
  UserPlus,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  ChevronDown,
  Users,
} from "lucide-react";
import Cookies from "js-cookie";
import { LoginButton, LogoutButton } from "@/components/auth-buttons";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/styled-components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui";

/**
 * User Menu Component
 * Shows signin button when not authenticated, user menu when authenticated
 * Uses safe auth hook that doesn't trigger redirects
 */
/**
 * Profile Selection Dialog - Modern UI/UX Design
 */
const ProfileSelectionDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}> = ({ open, onOpenChange, user }) => {
  const router = useRouter();
  const currentLanguage = Cookies.get("x-lang") || "en";
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  const handleSelection = (type: "student" | "staff" | "alumni") => {
    // Only student registration is ready
    if (type === "student") {
      onOpenChange(false);
      router.push(`/profileSetup/${type}`);
    } else {
      // Staff and Alumni are coming soon
      const { toast } = require("sonner");
      const messages = {
        staff: {
          en: "Staff registration is coming soon!",
          mm: "ဝန်ထမ်းမှတ်ပုံတင်ခြင်းကို မကြာမီ ရရှိနိုင်ပါမည်!",
        },
        alumni: {
          en: "Alumni registration is coming soon!",
          mm: "ကျောင်းဟောင်းမှတ်ပုံတင်ခြင်းကို မကြာမီ ရရှိနိုင်ပါမည်!",
        },
      };

      const message = messages[type][currentLanguage as keyof typeof messages[typeof type]]
        || messages[type].en;

      toast.info("Coming Soon", {
        description: message,
      });
    }
  };

  const texts = {
    en: {
      title: "Complete Your Profile",
      description: "Please select your role to complete registration",
      userInfo: {
        title: "Account Information",
        currentRole: "Current Role",
        profileStatus: "Profile Status",
        helper: "Your account is currently registered as a Guest user. To access full features and services, please complete your profile by selecting your appropriate role below.",
      },
      student: {
        title: "Student",
        description: "Register as a student for courses and academic resources",
        cta: "Continue",
      },
      staff: {
        title: "Staff",
        description: "Register as staff to manage courses and resources",
        cta: "Continue",
      },
      alumni: {
        title: "Alumni",
        description: "Register as alumni to stay connected with the university",
        cta: "Continue",
      },
      footer: "You can update your profile settings later",
    },
    mm: {
      title: "သင့်ကိုယ်ရေးအချက်အလက် ဖြည့်သွင်းရန်",
      description: "မှတ်ပုံတင်ခြင်းပြီးမြောက်ရန် သင့်အခန်းကဏ္ဍကို ရွေးချယ်ပါ",
      userInfo: {
        title: "အကောင့်အချက်အလက်",
        currentRole: "လက်ရှိအခန်းကဏ္ဍ",
        profileStatus: "ကိုယ်ရေးအခြေအနေ",
        helper: "သင့်အကောင့်ကို Guest အသုံးပြုသူအဖြစ် မှတ်ပုံတင်ထားပါသည်။ အင်္ဂါရပ်များနှင့် ဝန်ဆောင်မှုများ အပြည့်အဝ အသုံးပြုနိုင်ရန်၊ အောက်ပါတွင် သင့်သင့်လျော်သော အခန်းကဏ္ဍကို ရွေးချယ်ပြီး ကိုယ်ရေးအချက်အလက် ဖြည့်သွင်းပါ။",
      },
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
      footer: "သင့်ကိုယ်ရေးအချက်အလက်များကို နောက်မှ ပြင်ဆင်နိုင်ပါသည်",
    },
  };

  const t = texts[currentLanguage as keyof typeof texts] || texts.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white border border-gray-200 shadow-lg" showCloseButton={true}>
        {/* Header Section */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-[#4C67E1] to-[#3154A1] text-white">
          <div className="relative">
            <DialogTitle className="text-xl font-bold text-center text-white">
              {t.title}
            </DialogTitle>
            <DialogDescription className="text-center text-white/90 text-sm mt-1">
              {t.description}
            </DialogDescription>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-6">
          {/* User Information Section */}
          {user && (
            <div className="mb-6">
              <p className="text-sm text-gray-700 leading-relaxed text-center">
                {t.userInfo.helper}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Card */}
            <button
              type="button"
              onClick={() => handleSelection("student")}
              onMouseEnter={() => setHoveredCard("student")}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#4C67E1] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#4C67E1]/50"
            >
              {/* Icon Circle */}
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-[#4C67E1] to-[#3154A1] p-3 shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.student.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.student.description}
                </p>

                {/* CTA */}
                <div className="text-xs text-[#4C67E1] font-medium">
                  {t.student.cta} →
                </div>
              </div>
            </button>

            {/* Staff Card - Coming Soon */}
            <button
              type="button"
              onClick={() => handleSelection("staff")}
              onMouseEnter={() => setHoveredCard("staff")}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#1B4CB4] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#1B4CB4]/50 opacity-75"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Coming Soon
                </span>
              </div>

              {/* Icon Circle */}
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-[#1B4CB4] to-[#3154A1] p-3 shadow-md">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.staff.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.staff.description}
                </p>

                {/* CTA */}
                <div className="text-xs text-[#1B4CB4] font-medium">
                  {currentLanguage === "mm" ? "မကြာမီရရှိမည်" : "Coming Soon"} →
                </div>
              </div>
            </button>

            {/* Alumni Card - Coming Soon */}
            <button
              type="button"
              onClick={() => handleSelection("alumni")}
              onMouseEnter={() => setHoveredCard("alumni")}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#059669] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/50 opacity-75"
            >
              {/* Coming Soon Badge */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Coming Soon
                </span>
              </div>

              {/* Icon Circle */}
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-[#059669] to-[#047857] p-3 shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="mb-1 text-base font-bold text-gray-900">
                  {t.alumni.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 min-h-[2.5rem]">
                  {t.alumni.description}
                </p>

                {/* CTA */}
                <div className="text-xs text-[#059669] font-medium">
                  {currentLanguage === "mm" ? "မကြာမီရရှိမည်" : "Coming Soon"} →
                </div>
              </div>
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {t.footer}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const UserMenu: React.FC<{
  className?: string;
  variant?: "mobile" | "desktop";
}> = ({ className = "", variant = "desktop" }) => {
  const { isAuthenticated, user, isLoading } = useSafeAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Check if profile needs to be completed
  // Show modal for guest users with created/incomplete/pending profiles
  const needsProfileCompletion =
    user?.roles?.some((roleObj: any) => roleObj.Role === "guest") &&
    (user?.profileState === "created" ||
     user?.profileState === "incomplete" ||
     user?.profileState === "pending");

  // Auto-open dialog when user is authenticated as guest with incomplete profile
  useEffect(() => {
    if (!isLoading && isAuthenticated && needsProfileCompletion) {
      setShowProfileDialog(true);
    }
  }, [isLoading, isAuthenticated, needsProfileCompletion]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated - show login/signup options
  if (!isAuthenticated) {
    if (variant === "mobile") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`min-h-[44px] min-w-[44px] p-2 touch-manipulation border border-border rounded-lg bg-transparent hover:bg-accent focus:bg-accent outline-none flex items-center justify-center transition-all duration-200 ${className}`}
              aria-label="Authentication menu"
            >
              <LogIn className="h-4 w-4 text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-background border border-border rounded-lg shadow-lg"
          >
            <DropdownMenuItem>
              <LoginButton className="flex items-center w-full justify-start py-0.5 border-0 bg-transparent hover:bg-transparent text-foreground">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </LoginButton>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/signup"
                className="flex items-center w-full py-0.5 text-foreground hover:bg-transparent"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Sign Up
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Desktop - show compact text links
    return (
      <div className={`flex items-center gap-2 mt-0 ${className}`}>
        <LoginButton className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-action-button)] border-0 text-white rounded-b-md rounded-t-none hover:opacity-90">
          <LogIn className="h-4 w-4" />
          Sign In
        </LoginButton>
        <Link
          href="/signup"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-signup-button)] text-white rounded-b-md rounded-t-none hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Link>
      </div>
    );
  }

  // Authenticated - show user menu
  if (variant === "mobile") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`min-h-[44px] min-w-[44px] p-0 touch-manipulation border-0 shadow-none bg-transparent hover:bg-accent focus:bg-accent outline-none flex items-center justify-center ${className}`}
            aria-label="User menu"
          >
            <User className="h-4 w-4 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-background border border-border rounded-lg shadow-lg"
        >
          <div className="p-2">
            <div className="text-sm text-foreground font-medium">
              {user?.name || "User"}
            </div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
            {user?.roles && user.roles.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Role: {user.roles.map((r: any) => r.Role).join(", ")}
              </div>
            )}
            {user?.profileState && (
              <div className="text-xs text-muted-foreground mt-1">
                Profile Status: {user.profileState}
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          {needsProfileCompletion && (
            <>
              <DropdownMenuItem
                onClick={() => setShowProfileDialog(true)}
                className="flex items-center w-full py-0.5 text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Complete Your Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center w-full">
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/settings" className="flex items-center w-full">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center w-full">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="p-0">
            <LogoutButton className="w-full justify-start px-2 py-1.5 bg-transparent hover:bg-transparent text-foreground flex items-center cursor-pointer rounded-sm hover:bg-accent">
              <LogIn className="mr-2 h-4 w-4 rotate-180" />
              Sign Out
            </LogoutButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop user menu - Matches sign-in button design
  return (
    <>
      <ProfileSelectionDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={user}
      />
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors bg-[var(--color-header-action-button)] border-0 text-white rounded-b-md rounded-t-none hover:opacity-90"
              aria-haspopup="menu"
              aria-label="User menu"
              type="button"
            >
              <User className="h-4 w-4" />
              <span>{user?.name || "Account"}</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[280px] !bg-[var(--color-banner-bg)] border-white/20 shadow-lg rounded-md"
          >
            <div className="p-3 border-b border-white/20">
              <div className="text-sm text-white font-medium">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-white/80">{user?.email}</div>
              {user?.roles && user.roles.length > 0 && (
                <div className="text-xs text-white/80 mt-1">
                  Role: {user.roles.map((r: any) => r.Role).join(", ")}
                </div>
              )}
              {user?.profileState && (
                <div className="text-xs text-white/80 mt-1">
                  Profile Status: {user.profileState}
                </div>
              )}
            </div>
            {needsProfileCompletion && (
              <>
                <DropdownMenuItem
                  onClick={() => setShowProfileDialog(true)}
                  className="cursor-pointer hover:bg-white/10 p-3 text-amber-400 hover:text-amber-300 font-medium"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Complete Your Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-white/20" />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/profile" className="flex items-center w-full">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <Link href="/profile" className="flex items-center w-full">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="border-white/20" />
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white p-3">
              <LogoutButton className="w-full justify-start p-0 border-0 bg-transparent hover:bg-transparent text-white flex items-center">
                <LogIn className="mr-2 h-4 w-4 rotate-180" />
                Sign Out
              </LogoutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};
