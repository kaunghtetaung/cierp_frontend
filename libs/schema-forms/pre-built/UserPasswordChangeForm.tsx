"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@repo/ui";
import { Label } from "@repo/ui";
import { RadioGroup, RadioGroupItem } from "@repo/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Alert, AlertDescription } from "@repo/ui";
import { IconComponent } from "@repo/ui";
import { PasswordField } from "../PasswordField";
import { getLocalizedText } from "@repo/utils";
import type { PreBuiltFormProps } from "../ExtraActionFormRouter";

// Password reset modes
type PasswordResetMode = "generate" | "custom";

// Form data interface
interface PasswordResetFormData {
  mode: PasswordResetMode;
  customPassword?: string;
}

// Form validation schema  
const createPasswordResetSchema = (currentLanguage: string) =>
  z.object({
    mode: z.enum(["generate", "custom"]),
    customPassword: z.string().optional(),
  }).superRefine((data, ctx) => {
    // Only validate password if in custom mode
    if (data.mode === "custom") {
      const password = data.customPassword;
      
      if (!password || password.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက် လိုအပ်သည်"
            : "Password is required",
        });
        return;
      }
      
      // Password strength validation
      if (password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်"
            : "Password must be at least 8 characters",
        });
      }
      if (!/[a-z]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက်တွင် အသေးစာလုံး ပါဝင်ရမည်"
            : "Password must contain lowercase letters",
        });
      }
      if (!/[A-Z]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက်တွင် အကြီးစာလုံး ပါဝင်ရမည်"
            : "Password must contain uppercase letters",
        });
      }
      if (!/[0-9]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက်တွင် ဂဏန်း ပါဝင်ရမည်"
            : "Password must contain numbers",
        });
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customPassword'],
          message: currentLanguage === "mm"
            ? "စကားဝှက်တွင် အထူးစာလုံး ပါဝင်ရမည်"
            : "Password must contain special characters",
        });
      }
    }
  });

export function UserPasswordChangeForm({
  action,
  selectedItems,
  currentLanguage,
  onSubmit,
  onCancel,
  hideHeader = false,
  moduleSlug,
}: PreBuiltFormProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    generatedPassword?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  

  // Create validation schema
  const passwordResetSchema = createPasswordResetSchema(currentLanguage);

  // Initialize form
  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      mode: "generate",
      customPassword: "",
    },
    mode: "onChange", // Enable real-time validation
  });


  // Listen for password reset completion event (for confirmation dialog flow)
  React.useEffect(() => {
    const handlePasswordResetComplete = (event: CustomEvent) => {
      const { success, generatedPassword } = event.detail;
      const currentFormValues = form.watch();
      
      if (success && currentFormValues.mode === 'generate' && generatedPassword) {
        const newResult = {
          success: true,
          message:
            currentLanguage === "mm"
              ? "စကားဝှက် အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ"
              : "Password has been reset successfully",
          generatedPassword: generatedPassword,
        };
        
        setSubmitResult(newResult);
        setIsSubmitting(false);
      }
    };

    // Add event listener
    window.addEventListener('resetPasswordComplete', handlePasswordResetComplete as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('resetPasswordComplete', handlePasswordResetComplete as EventListener);
    };
  }, [currentLanguage, form]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = form;

  // Watch the mode to show/hide custom password field
  const selectedMode = watch("mode");

  // Handle form submission
  const handleFormSubmit = async (data: PasswordResetFormData) => {
    if (!selectedItems || selectedItems.length === 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Create FormData for server action
      const formData = new FormData();

      // Add metadata
      formData.append("actionKey", action.actionKey);
      formData.append("mode", data.mode);
      
      // Add moduleSlug if provided and not undefined string
      if (moduleSlug && moduleSlug !== 'undefined') {
        formData.append("moduleSlug", moduleSlug);
      } else {
        console.warn('UserPasswordChangeForm: moduleSlug is missing or undefined');
      }

      // Add custom password only if in custom mode
      if (data.mode === "custom" && data.customPassword) {
        formData.append("password", data.customPassword);
      }

      // Add selected user ID
      if (selectedItems.length > 0) {
        formData.append("id", selectedItems[0]);
      }

      // Submit to server action
      const result = await onSubmit(formData);

      // Check for result data from the server action
      const resultData = (window as any).lastExtraActionResult;
      
      // Show success message with generated password if available (only for generate mode)
      const successResult = {
        success: true,
        message:
          currentLanguage === "mm"
            ? "စကားဝှက် အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ"
            : "Password has been reset successfully",
        generatedPassword: data.mode === 'generate' ? resultData?.newPassword : undefined,
      };
      
      setSubmitResult(successResult);

      // Clear the stored result
      delete (window as any).lastExtraActionResult;

      // Only reset form if we don't have a generated password to display
      if (!(data.mode === 'generate' && resultData?.newPassword)) {
        reset();
      }
    } catch (error) {
      const errorResult = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : currentLanguage === "mm"
            ? "စကားဝှက် ပြန်လည်သတ်မှတ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
            : "An error occurred while resetting the password",
      };
      
      setSubmitResult(errorResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user identifier for display
  const getUserIdentifier = () => {
    if (selectedItems && selectedItems.length > 0) {
      return selectedItems[0];
    }
    return currentLanguage === "mm" ? "ရွေးချယ်ထားသော အသုံးပြုသူ" : "Selected User";
  };

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <IconComponent name={action.iconName || "KeyRound"} className="w-5 h-5" />
            {getLocalizedText(action.title, currentLanguage)}
          </div>
          {action.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {getLocalizedText(action.description, currentLanguage)}
            </p>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            {currentLanguage === "mm" ? "အသုံးပြုသူ: " : "User: "}
            <span className="font-mono">{getUserIdentifier()}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Show result if available */}
        {submitResult && (
          <Alert 
            variant={submitResult.success ? "default" : "destructive"}
            className={submitResult.success && submitResult.generatedPassword 
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" 
              : ""
            }
          >
            <IconComponent
              name={submitResult.success ? "CheckCircle" : "AlertCircle"}
              className="w-4 h-4"
            />
            <AlertDescription>{submitResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Generated Password Display - Separate from Alert */}
        {submitResult?.success && submitResult?.generatedPassword && (
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                {currentLanguage === "mm" ? "ဖန်တီးထားသော စကားဝှက်" : "Generated Password"}
              </h4>
              <div className="bg-white dark:bg-gray-900 p-3 rounded border space-y-2">
                <div
                  className="text-lg font-mono text-gray-900 dark:text-gray-100 block cursor-pointer select-all break-all bg-gray-50 dark:bg-gray-800 p-3 rounded border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  onClick={(e) => {
                    // Select all text when clicked
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.target as Node);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }}
                  title="Click to select all, then copy with Ctrl+C or Cmd+C"
                >
                  {submitResult.generatedPassword}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentLanguage === "mm" 
                    ? "👆 စကားဝှက်ပေါ်တွင် နှိပ်ပြီး Ctrl+C ဖြင့် ကူးယူပါ"
                    : "👆 Click password above to select, then press Ctrl+C (or Cmd+C) to copy"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const password = submitResult.generatedPassword;
                  if (!password) return;
                  
                  // Check if we're in a secure context (HTTPS or localhost)
                  const canUseClipboardAPI = window.isSecureContext && navigator.clipboard;
                  
                  if (canUseClipboardAPI) {
                    try {
                      await navigator.clipboard.writeText(password);
                      console.log('✅ Password copied successfully via Clipboard API');
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                      return;
                    } catch (err) {
                      console.log('❌ Clipboard API failed:', err);
                    }
                  }
                  
                  // For HTTP mode, show instruction instead of trying execCommand
                  alert(currentLanguage === "mm" 
                    ? `ကူးယူရန် မအောင်မြင်ပါ။ ကျေးဇူးပြုပြီး စကားဝှက်ပေါ်တွင် နှိပ်ပြီး Ctrl+C ဖြင့် ကူးယူပါ: ${password}`
                    : `Auto-copy failed. Please click the password above to select it, then press Ctrl+C (or Cmd+C) to copy: ${password}`
                  );
                }}
                className={isCopied ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                <IconComponent name={isCopied ? "Check" : "Copy"} className="w-4 h-4 mr-2" />
                {isCopied 
                  ? (currentLanguage === "mm" ? "ကူးယူပြီး!" : "Copied!") 
                  : (currentLanguage === "mm" ? "စကားဝှက် ကူးယူမည်" : "Try Auto-Copy")
                }
              </Button>
              
              {/* HTTP mode instruction */}
              {!window.isSecureContext && (
                <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-700">
                  <span className="font-semibold">
                    {currentLanguage === "mm" ? "HTTP မုဒ်:" : "HTTP Mode:"}
                  </span>{" "}
                  {currentLanguage === "mm" 
                    ? "အလိုအလျောက် ကူးယူခြင်း အလုပ်မလုပ်ပါ။ စကားဝှက်ပေါ်တွင် နှိပ်ပြီး manual ကူးယူပါ။"
                    : "Auto-copy may not work. Click the password above to select it manually."
                  }
                </p>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3">
              <div className="flex items-start gap-2">
                <IconComponent name="AlertTriangle" className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {currentLanguage === "mm" 
                    ? "ဤစကားဝှက်ကို လုံခြုံသောနေရာတွင် သိမ်းဆည်းပါ။ ထပ်မံ ပြသမည် မဟုတ်ပါ။"
                    : "Please save this password in a secure location. It will not be shown again."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form - Hide when password is successfully generated */}
        {!(submitResult?.success && submitResult?.generatedPassword) && (
          <form 
            onSubmit={handleSubmit(handleFormSubmit)} 
            className="space-y-4"
          >
          {/* Password Reset Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {currentLanguage === "mm"
                ? "စကားဝှက် ပြန်လည်သတ်မှတ်ခြင်း နည်းလမ်း"
                : "Password Reset Method"}
            </Label>
            <Controller
              name="mode"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 gap-4"
                >
                  {/* Generate Password Option */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="generate" id="generate" />
                    <div className="flex-1">
                      <Label htmlFor="generate" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <IconComponent name="Shuffle" className="w-4 h-4" />
                          {currentLanguage === "mm"
                            ? "လုံခြုံသော စကားဝှက် အလိုအလျောက် ဖန်တီးပါ"
                            : "Generate secure password automatically"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {currentLanguage === "mm"
                            ? "စနစ်က လုံခြုံသော စကားဝှက်ကို အလိုအလျောက် ဖန်တီးပေးမည်"
                            : "System will automatically generate a secure password"}
                        </div>
                      </Label>
                    </div>
                  </div>

                  {/* Custom Password Option */}
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="custom" id="custom" />
                    <div className="flex-1">
                      <Label htmlFor="custom" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <IconComponent name="Edit" className="w-4 h-4" />
                          {currentLanguage === "mm"
                            ? "စကားဝှက် ကိုယ်တိုင် သတ်မှတ်ပါ"
                            : "Set custom password"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {currentLanguage === "mm"
                            ? "သင့်ကိုယ်ပိုင် စကားဝှက် ရိုက်ထည့်ပါ"
                            : "Enter your own custom password"}
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.mode && (
              <p className="text-sm text-destructive">{errors.mode.message}</p>
            )}
          </div>

          {/* Custom Password Field (only show when custom mode is selected) */}
          {selectedMode === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customPassword">
                {currentLanguage === "mm" ? "အသစ်သော စကားဝှက်" : "New Password"}
              </Label>
              <Controller
                name="customPassword"
                control={control}
                render={({ field }) => (
                  <PasswordField
                    {...field}
                    placeholder={
                      currentLanguage === "mm"
                        ? "လုံခြုံသော စကားဝှက် ရိုက်ထည့်ပါ"
                        : "Enter a secure password"
                    }
                    showStrengthIndicator={true}
                    currentLanguage={currentLanguage}
                    error={!!errors.customPassword}
                  />
                )}
              />
              {errors.customPassword && (
                <p className="text-sm text-destructive">{errors.customPassword.message}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              {currentLanguage === "mm" ? "မလုပ်တော့" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              variant={action.buttonStyle === "warning" ? "destructive" : "default"}
            >
              {isSubmitting && <IconComponent name="Loader2" className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting
                ? currentLanguage === "mm"
                  ? "ပြန်လည်သတ်မှတ်နေသည်..."
                  : "Resetting..."
                : currentLanguage === "mm"
                ? "စကားဝှက် ပြန်လည်သတ်မှတ်မည်"
                : "Reset Password"}
            </Button>
          </div>
        </form>
        )}

        {/* Success State Action Buttons - Show when password is successfully generated */}
        {submitResult?.success && submitResult?.generatedPassword && (
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <IconComponent name="Check" className="w-4 h-4 mr-2" />
              {currentLanguage === "mm" ? "ပြီးပါပြီ" : "Done"}
            </Button>
          </div>
        )}

        {/* Information */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <IconComponent name="Info" className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              {currentLanguage === "mm" ? (
                <>
                  <p className="mb-1">• အလိုအလျောက် ဖန်တီးထားသော စကားဝှက်များသည် အလွန်လုံခြုံပါသည်</p>
                  <p className="mb-1">• အသုံးပြုသူသည် ပထမဆုံး လော့ဂ်အင်ဝင်ရောက်သောအခါ စကားဝှက် ပြောင်းလဲရပါမည်</p>
                  <p>• စကားဝှက် ပြန်လည်သတ်မှတ်ပြီးသည်နှင့် အသုံးပြုသူကို အီးမေးလ်ဖြင့် အကြောင်းကြားပါမည်</p>
                </>
              ) : (
                <>
                  <p className="mb-1">• Auto-generated passwords are highly secure</p>
                  <p className="mb-1">• User must change password on first login</p>
                  <p>• User will be notified via email after password reset</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}