"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, Shield, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import type { TenantSettings } from "@repo/types";

interface VerifyEmailClientProps {
  tenantSettings: TenantSettings | null;
  initialLang: string;
}

export function VerifyEmailClient({ tenantSettings, initialLang }: VerifyEmailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const lang = initialLang as 'en' | 'mm' || 'en';
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  const translations = {
    en: {
      pageTitle: 'Email Verification',
      pageSubtitle: 'Confirming your email address',
      verifying: 'Verifying your email...',
      verifyingDesc: 'Please wait while we confirm your email address',
      successTitle: 'Email Verified Successfully!',
      successDesc: 'Your email has been confirmed and your account is now active',
      redirecting: 'Redirecting to login page...',
      errorTitle: 'Verification Failed',
      errorDesc: 'We could not verify your email address',
      invalidTitle: 'Invalid Link',
      invalidDesc: 'This verification link is invalid or has expired',
      tryAgain: 'Request New Link',
      goToLogin: 'Go to Login',
      goToSignup: 'Go to Sign Up',
      contactSupport: 'Contact Support'
    },
    mm: {
      pageTitle: 'အီးမေးလ် အတည်ပြုခြင်း',
      pageSubtitle: 'သင့်အီးမေးလ်လိပ်စာကို အတည်ပြုနေပါသည်',
      verifying: 'သင့်အီးမေးလ်ကို အတည်ပြုနေပါသည်...',
      verifyingDesc: 'သင့်အီးမေးလ်လိပ်စာကို အတည်ပြုနေစဉ် ခေတ္တစောင့်ပါ',
      successTitle: 'အီးမေးလ် အတည်ပြုခြင်း အောင်မြင်ပါပြီ!',
      successDesc: 'သင့်အီးမေးလ်ကို အတည်ပြုပြီး သင့်အကောင့်ကို အသုံးပြုနိုင်ပါပြီ',
      redirecting: 'လော့ဂ်အင် စာမျက်နှာသို့ ပြောင်းနေပါသည်...',
      errorTitle: 'အတည်ပြုခြင်း မအောင်မြင်ပါ',
      errorDesc: 'သင့်အီးမေးလ်လိပ်စာကို အတည်ပြု၍ မရပါ',
      invalidTitle: 'လင့်ခ် မမှန်ကန်ပါ',
      invalidDesc: 'ဤအတည်ပြုလင့်ခ်သည် မမှန်ကန်ပါ သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ',
      tryAgain: 'လင့်ခ်အသစ် တောင်းရန်',
      goToLogin: 'လော့ဂ်အင် စာမျက်နှာသို့',
      goToSignup: 'စာရင်းသွင်းရန်',
      contactSupport: 'ပံ့ပိုးမှုအဖွဲ့ကို ဆက်သွယ်ရန်'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage(t.invalidDesc);
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(data.message || t.successDesc);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || t.errorDesc);
      }
    } catch (error) {
      setStatus("error");
      setMessage(t.errorDesc);
    }
  };

  const getPageIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-5 h-5 mr-2 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />;
      case "error":
      case "invalid":
        return <XCircle className="w-5 h-5 mr-2 text-red-600" />;
      default:
        return <Mail className="w-5 h-5 mr-2" />;
    }
  };

  const getPageTitle = () => {
    switch (status) {
      case "loading":
        return t.verifying;
      case "success":
        return t.successTitle;
      case "error":
        return t.errorTitle;
      case "invalid":
        return t.invalidTitle;
      default:
        return t.pageTitle;
    }
  };

  const getPageSubtitle = () => {
    switch (status) {
      case "loading":
        return t.verifyingDesc;
      case "success":
        return t.redirecting;
      default:
        return undefined;
    }
  };

  return (
    <div className="min-h-screen h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4">
      <div className="w-full max-w-lg animate-fadeIn">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm mb-6 transition-all hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-gray-50 to-white px-8 py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {getPageIcon()}
              {getPageTitle()}
            </h1>
            {getPageSubtitle() && (
              <p className="text-sm text-gray-600 text-center mt-2">
                {getPageSubtitle()}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {status === "loading" && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center animate-pulse">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-600">{t.verifyingDesc}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-progress" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.successTitle}</h3>
                  <p className="text-gray-600">{message || t.successDesc}</p>
                  <p className="text-sm text-gray-500 animate-pulse">{t.redirecting}</p>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {t.goToLogin}
                  </Link>
                </div>
              )}

              {status === "error" && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                      <XCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.errorTitle}</h3>
                  <p className="text-gray-600">{message || t.errorDesc}</p>
                  <div className="flex gap-3 justify-center">
                    <Link 
                      href="/signup" 
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      {t.tryAgain}
                    </Link>
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t.contactSupport}
                    </Link>
                  </div>
                </div>
              )}

              {status === "invalid" && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                      <Mail className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.invalidTitle}</h3>
                  <p className="text-gray-600">{message || t.invalidDesc}</p>
                  <div className="flex gap-3 justify-center">
                    <Link 
                      href="/signup" 
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      {t.goToSignup}
                    </Link>
                    <Link 
                      href="/login" 
                      className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t.goToLogin}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}