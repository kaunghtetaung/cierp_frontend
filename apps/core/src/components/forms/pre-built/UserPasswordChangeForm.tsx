"use client";

import React, { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconComponent } from "@repo/ui/components/icons";
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
}: PreBuiltFormProps) {
  
  console.log(`🎯 UserPasswordChangeForm: Component rendered (render #${renderCountRef.current})`, {
    actionKey: action?.actionKey,
    selectedItems,
    selectedItemsLength: selectedItems?.length,
    hasOnSubmit: typeof onSubmit === 'function',
    currentLanguage,
    hideHeader,
    hasSubmitResult: !!submitResult,
    submitResultSuccess: submitResult?.success,
    hasGeneratedPassword: !!submitResult?.generatedPassword,
    generatedPasswordLength: submitResult?.generatedPassword?.length
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    generatedPassword?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Create a ref to track the latest submitResult value
  const submitResultRef = useRef(submitResult);
  
  // Create a render counter to track re-renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  // Update ref whenever submitResult changes
  React.useEffect(() => {
    submitResultRef.current = submitResult;
    console.log(`🎯 PASSWORD FORM DEBUG: submitResult ref updated:`, {
      newValue: submitResult,
      hasSubmitResult: !!submitResult,
      hasGeneratedPassword: !!submitResult?.generatedPassword
    });
  }, [submitResult]);

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

  // Debug form state changes
  React.useEffect(() => {
    console.log(`🎯 FORM STATE DEBUG: Form state changed`, {
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      errors: form.formState.errors,
      values: form.watch()
    });
  }, [form.formState.isValid, form.formState.isSubmitting, form.formState.errors]);

  // Listen for password reset completion event (for confirmation dialog flow)
  React.useEffect(() => {
    const handlePasswordResetComplete = (event: CustomEvent) => {
      console.log(`🎯 PASSWORD FORM DEBUG: Received resetPasswordComplete event:`, event.detail);
      
      const { success, generatedPassword } = event.detail;
      const currentFormValues = form.watch();
      
      if (success && currentFormValues.mode === 'generate' && generatedPassword) {
        console.log(`🎯 PASSWORD FORM DEBUG: Setting generated password result from event`);
        
        const newResult = {
          success: true,
          message:
            currentLanguage === "mm"
              ? "စကားဝှက် အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ"
              : "Password has been reset successfully",
          generatedPassword: generatedPassword,
        };
        
        console.log(`🎯 PASSWORD FORM DEBUG: About to set submitResult:`, newResult);
        setSubmitResult(newResult);
        
        console.log(`🎯 PASSWORD FORM DEBUG: About to set isSubmitting to false`);
        setIsSubmitting(false);
        
        // Force a re-render check by logging the updated state after a timeout
        setTimeout(() => {
          console.log(`🎯 PASSWORD FORM DEBUG: State after timeout (should be updated):`, {
            hasSubmitResult: !!submitResultRef.current,
            submitResultAfterUpdate: submitResultRef.current,
            newResultWeJustSet: newResult,
            stateMatch: JSON.stringify(submitResultRef.current) === JSON.stringify(newResult)
          });
        }, 100);
        
        // Don't clear the form yet - let user see the generated password first
        console.log(`🎯 PASSWORD FORM DEBUG: Form state update completed`);
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
    console.log(`🎯 PASSWORD FORM DEBUG: Form submission started`, {
      selectedItems,
      selectedItemsLength: selectedItems?.length,
      actionKey: action.actionKey,
      formData: data
    });

    if (!selectedItems || selectedItems.length === 0) {
      console.error(`🎯 PASSWORD FORM DEBUG: No selected items - cannot submit`);
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

      console.log(`🎯 PASSWORD FORM DEBUG: Form data preparation`, {
        actionKey: action.actionKey,
        mode: data.mode,
        selectedUserId: selectedItems[0],
        hasCustomPassword: data.mode === "custom" && !!data.customPassword
      });

      // Add custom password only if in custom mode
      if (data.mode === "custom" && data.customPassword) {
        formData.append("password", data.customPassword);
        console.log(`🎯 PASSWORD FORM DEBUG: Custom password added to form data (length: ${data.customPassword.length})`);
      } else if (data.mode === "custom") {
        console.warn(`🎯 PASSWORD FORM DEBUG: Custom mode but no password provided`);
      }

      // Add selected user ID
      if (selectedItems.length > 0) {
        formData.append("id", selectedItems[0]);
        console.log(`🎯 PASSWORD FORM DEBUG: User ID added to form data: ${selectedItems[0]}`);
      }

      console.log(`🎯 PASSWORD FORM DEBUG: Calling onSubmit with form data`);
      console.log(`🎯 PASSWORD FORM DEBUG: onSubmit function:`, onSubmit);
      console.log(`🎯 PASSWORD FORM DEBUG: onSubmit type:`, typeof onSubmit);
      
      // Submit to server action
      const result = await onSubmit(formData);

      console.log(`🎯 PASSWORD FORM DEBUG: onSubmit completed successfully with result:`, result);

      // Check for result data from the server action
      const resultData = (window as any).lastExtraActionResult;
      
      console.log(`🎯 PASSWORD FORM DEBUG: Result data from server:`, {
        resultData,
        hasResultData: !!resultData,
        hasNewPassword: !!resultData?.newPassword,
        newPasswordLength: resultData?.newPassword?.length,
        currentMode: data.mode,
        willShowGeneratedPassword: data.mode === 'generate' && !!resultData?.newPassword
      });
      
      // Show success message with generated password if available (only for generate mode)
      const successResult = {
        success: true,
        message:
          currentLanguage === "mm"
            ? "စကားဝှက် အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ"
            : "Password has been reset successfully",
        generatedPassword: data.mode === 'generate' ? resultData?.newPassword : undefined,
      };
      
      console.log(`🎯 PASSWORD FORM DEBUG: Setting success result:`, successResult);
      setSubmitResult(successResult);

      // Clear the stored result
      delete (window as any).lastExtraActionResult;

      // Reset form
      reset();
    } catch (error) {
      console.error(`🎯 PASSWORD FORM DEBUG: Form submission error:`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      const errorResult = {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : currentLanguage === "mm"
            ? "စကားဝှက် ပြန်လည်သတ်မှတ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားခဲ့သည်"
            : "An error occurred while resetting the password",
      };
      
      console.log(`🎯 PASSWORD FORM DEBUG: Setting error result:`, errorResult);
      setSubmitResult(errorResult);
    } finally {
      setIsSubmitting(false);
      console.log(`🎯 PASSWORD FORM DEBUG: Form submission completed (finally block)`);
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
    <Card className="w-full max-w-md mx-auto">
      {!hideHeader && (
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <IconComponent name={action.iconName || "KeyRound"} className="w-5 h-5" />
            {getLocalizedText(action.title, currentLanguage)}
          </CardTitle>
          {action.description && (
            <CardDescription>
              {getLocalizedText(action.description, currentLanguage)}
            </CardDescription>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            {currentLanguage === "mm" ? "အသုံးပြုသူ: " : "User: "}
            <span className="font-mono">{getUserIdentifier()}</span>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Show result if available */}
        {(() => {
          console.log(`🎯 PASSWORD FORM UI DEBUG: Evaluating submitResult render condition`, {
            hasSubmitResult: !!submitResult,
            submitResultSuccess: submitResult?.success,
            hasGeneratedPassword: !!submitResult?.generatedPassword,
            generatedPassword: submitResult?.generatedPassword ? '[REDACTED]' : undefined,
            willRenderAlert: !!submitResult,
            willRenderPasswordUI: submitResult?.success && !!submitResult?.generatedPassword
          });
          return null;
        })()}
        {submitResult && (
          <Alert variant={submitResult.success ? "default" : "destructive"}>
            <IconComponent
              name={submitResult.success ? "CheckCircle" : "AlertCircle"}
              className="w-4 h-4"
            />
            <AlertDescription>{submitResult.message}</AlertDescription>
            {(() => {
              console.log(`🎯 PASSWORD FORM UI DEBUG: Evaluating generated password UI condition`, {
                submitResultSuccess: submitResult?.success,
                hasGeneratedPassword: !!submitResult?.generatedPassword,
                generatedPasswordValue: submitResult?.generatedPassword ? '[REDACTED]' : undefined,
                willRenderPasswordUI: submitResult?.success && !!submitResult?.generatedPassword
              });
              return null;
            })()}
            {submitResult.success && submitResult.generatedPassword && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium">
                  {currentLanguage === "mm" ? "ဖန်တီးထားသော စကားဝှက်" : "Generated Password"}
                </Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <input
                    type="text"
                    value={submitResult.generatedPassword}
                    readOnly
                    className="flex-1 bg-transparent border-0 font-mono text-sm focus:outline-none select-all"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={isCopied ? "default" : "outline"}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(submitResult.generatedPassword || '');
                        setIsCopied(true);
                        console.log('Password copied to clipboard');
                        
                        // Reset the copied state after 2 seconds
                        setTimeout(() => setIsCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy password:', err);
                      }
                    }}
                    className="shrink-0"
                  >
                    <IconComponent name={isCopied ? "Check" : "Copy"} className="w-4 h-4 mr-1" />
                    {isCopied 
                      ? (currentLanguage === "mm" ? "ကူးယူပြီး" : "Copied!")
                      : (currentLanguage === "mm" ? "ကူးယူ" : "Copy")
                    }
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentLanguage === "mm" 
                    ? "ဤစကားဝှက်ကို လုံခြုံသောနေရာတွင် သိမ်းဆည်းပါ။ ထပ်မံ ပြသမည် မဟုတ်ပါ။"
                    : "Please save this password in a secure location. It will not be shown again."
                  }
                </p>
              </div>
            )}
          </Alert>
        )}

        {/* Form - Hide when password is successfully generated */}
        {!(submitResult?.success && submitResult?.generatedPassword) && (
          <form 
            onSubmit={(e) => {
              console.log(`🎯 FORM DEBUG: Form onSubmit triggered`, {
                event: e,
                hasErrors: Object.keys(errors).length > 0,
                errors,
                formValues: watch()
              });
              handleSubmit(handleFormSubmit)(e);
            }} 
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
              onClick={(e) => {
                console.log(`🎯 BUTTON DEBUG: Submit button clicked`, {
                  event: e,
                  isSubmitting,
                  formState: form.formState,
                  isValid: form.formState.isValid,
                  selectedItems
                });
              }}
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
      </CardContent>
    </Card>
  );
}