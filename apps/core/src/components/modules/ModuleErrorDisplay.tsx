"use client";

import React from "react";
import { IconComponent } from "@repo/ui";
import { useLanguage } from "@repo/language";

/**
 * Enhanced Error Display Component for Module DataTables
 *
 * Displays rich error information including:
 * - Category-specific icons and styling
 * - User-friendly messages (from backend or frontend i18n)
 * - Error codes and status codes
 * - Trace IDs for support reference
 * - Recovery actions as actionable items
 * - Multilingual support (en/mm)
 */

export interface ModuleErrorDisplayProps {
  error: any; // Can be Error, ApiError, or enhanced error from server action
  module?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

interface ErrorMetadata {
  category?: string;
  statusCode?: number;
  errorCode?: string;
  traceId?: string;
  userMessage?: string;
  backendMessage?: string;
  message: string;
  recoveryActions?: string[];
}

export function ModuleErrorDisplay({
  error,
  module,
  onRetry,
  isRetrying = false,
}: ModuleErrorDisplayProps) {
  const { currentLanguage } = useLanguage();

  // Extract error metadata
  const errorMetadata: ErrorMetadata = React.useMemo(() => {
    if (!error) {
      return {
        message: currentLanguage === "mm"
          ? "မမျှော်လင့်ထားသော အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
          : "An unexpected error occurred"
      };
    }

    return {
      category: error.category || error.errorCategory,
      statusCode: error.statusCode || error.status,
      errorCode: error.errorCode || error.code || error.backendErrorCode,
      traceId: error.traceId,
      userMessage: error.userMessage,
      backendMessage: error.backendMessage,
      message: error.message || error.error || "Unknown error",
      recoveryActions: error.recoveryActions,
    };
  }, [error, currentLanguage]);

  // Determine error icon and color based on category or status code
  const getErrorStyle = () => {
    const category = errorMetadata.category?.toLowerCase();
    const statusCode = errorMetadata.statusCode;

    // Category-based styling
    if (category === 'network' || category === 'timeout') {
      return {
        icon: "WifiOff" as const,
        iconClass: "text-orange-500",
        titleClass: "text-orange-700 dark:text-orange-400",
        borderClass: "border-orange-200 dark:border-orange-800",
      };
    }

    if (category === 'authentication') {
      return {
        icon: "LockKeyhole" as const,
        iconClass: "text-amber-500",
        titleClass: "text-amber-700 dark:text-amber-400",
        borderClass: "border-amber-200 dark:border-amber-800",
      };
    }

    if (category === 'authorization') {
      return {
        icon: "ShieldAlert" as const,
        iconClass: "text-yellow-500",
        titleClass: "text-yellow-700 dark:text-yellow-400",
        borderClass: "border-yellow-200 dark:border-yellow-800",
      };
    }

    if (category === 'validation' || statusCode === 422) {
      return {
        icon: "AlertTriangle" as const,
        iconClass: "text-orange-500",
        titleClass: "text-orange-700 dark:text-orange-400",
        borderClass: "border-orange-200 dark:border-orange-800",
      };
    }

    if (category === 'not_found' || statusCode === 404) {
      return {
        icon: "SearchX" as const,
        iconClass: "text-gray-500",
        titleClass: "text-gray-700 dark:text-gray-400",
        borderClass: "border-gray-200 dark:border-gray-800",
      };
    }

    // Server errors (500+)
    if (category === 'server_error' || (statusCode && statusCode >= 500)) {
      return {
        icon: "ServerCrash" as const,
        iconClass: "text-red-500",
        titleClass: "text-red-700 dark:text-red-400",
        borderClass: "border-red-200 dark:border-red-800",
      };
    }

    // Default/unknown error
    return {
      icon: "AlertCircle" as const,
      iconClass: "text-destructive",
      titleClass: "text-destructive",
      borderClass: "border-destructive/20",
    };
  };

  const style = getErrorStyle();

  // Get user-friendly title
  const getTitle = () => {
    const category = errorMetadata.category?.toLowerCase();

    if (currentLanguage === "mm") {
      if (category === 'network' || category === 'timeout') return "ကွန်ရက် ချိတ်ဆက်မှု ပြဿနာ";
      if (category === 'authentication') return "လော့ဂ်အင် လိုအပ်သည်";
      if (category === 'authorization') return "ခွင့်ပြုချက် မရှိပါ";
      if (category === 'validation') return "အချက်အလက် မှားယွင်းနေသည်";
      if (category === 'not_found') return "ရှာမတွေ့ပါ";
      if (category === 'server_error') return "ဆာဗာ အမှားအယွင်း";
      return "အချက်အလက် ရယူ၍ မရပါ";
    } else {
      if (category === 'network' || category === 'timeout') return "Network Connection Error";
      if (category === 'authentication') return "Authentication Required";
      if (category === 'authorization') return "Access Denied";
      if (category === 'validation') return "Validation Error";
      if (category === 'not_found') return "Not Found";
      if (category === 'server_error') return "Server Error";
      return "Failed to Load Data";
    }
  };

  // Get display message (priority: userMessage > backendMessage > message)
  const getDisplayMessage = () => {
    return errorMetadata.userMessage ||
           errorMetadata.backendMessage ||
           errorMetadata.message ||
           (currentLanguage === "mm" ? "မမျှော်လင့်ထားသော အမှားအယွင်း" : "Unknown error occurred");
  };

  // Get default recovery actions if none provided
  const getRecoveryActions = (): string[] => {
    if (errorMetadata.recoveryActions && errorMetadata.recoveryActions.length > 0) {
      return errorMetadata.recoveryActions;
    }

    // Provide default recovery actions based on error category
    const category = errorMetadata.category?.toLowerCase();

    if (currentLanguage === "mm") {
      if (category === 'network' || category === 'timeout') {
        return ["အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ", "စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေပါ"];
      }
      if (category === 'authentication') {
        return ["ပြန်လည် လော့ဂ်အင်ဝင်ပါ"];
      }
      if (category === 'authorization') {
        return ["စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ"];
      }
      return ["စာမျက်နှာကို ပြန်လည်ရှင်းသန့်စေပါ", "နောက်မှ ထပ်မံကြိုးစားပါ"];
    } else {
      if (category === 'network' || category === 'timeout') {
        return ["Check your internet connection", "Refresh the page"];
      }
      if (category === 'authentication') {
        return ["Log in again"];
      }
      if (category === 'authorization') {
        return ["Contact your administrator"];
      }
      return ["Refresh the page", "Try again later"];
    }
  };

  const recoveryActions = getRecoveryActions();

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border rounded-lg ${style.borderClass}`}>
      <IconComponent
        name={style.icon}
        className={`w-12 h-12 mb-4 ${style.iconClass}`}
      />

      <h3 className={`text-lg font-semibold mb-2 ${style.titleClass}`}>
        {getTitle()}
      </h3>

      <p className="text-muted-foreground mb-4 max-w-md">
        {getDisplayMessage()}
      </p>

      {/* Error details */}
      {(errorMetadata.errorCode || errorMetadata.statusCode) && (
        <div className="text-xs text-muted-foreground mb-4 font-mono">
          {errorMetadata.errorCode && (
            <span className="mr-3">
              {currentLanguage === "mm" ? "အမှား ကုဒ်" : "Error Code"}: {errorMetadata.errorCode}
            </span>
          )}
          {errorMetadata.statusCode && (
            <span>
              {currentLanguage === "mm" ? "အခြေအနေ" : "Status"}: {errorMetadata.statusCode}
            </span>
          )}
        </div>
      )}

      {/* Trace ID for support */}
      {errorMetadata.traceId && (
        <div className="text-xs text-muted-foreground mb-4 bg-muted px-3 py-1 rounded">
          {currentLanguage === "mm" ? "အစီရင်ခံမှု နံပါတ်" : "Report ID"}: <span className="font-mono">{errorMetadata.traceId}</span>
        </div>
      )}

      {/* Recovery actions */}
      {recoveryActions.length > 0 && (
        <div className="mb-4 text-sm">
          <p className="font-medium mb-2">
            {currentLanguage === "mm" ? "အကြံပြုချက်များ:" : "Suggestions:"}
          </p>
          <ul className="text-left inline-block space-y-1">
            {recoveryActions.map((action, index) => (
              <li key={index} className="flex items-start">
                <IconComponent name="ChevronRight" className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconComponent
            name={isRetrying ? "Loader2" : "RotateCcw"}
            className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
          />
          {currentLanguage === "mm" ? "ပြန်လည်ကြိုးစားမည်" : "Try Again"}
        </button>
      )}
    </div>
  );
}
