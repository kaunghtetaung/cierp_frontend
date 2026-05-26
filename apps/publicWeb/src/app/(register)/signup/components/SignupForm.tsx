"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Mail, UserCircle, Lock, Eye, EyeOff } from "lucide-react";
import { initiateLogin } from "@repo/auth/login-utils";
import { signupAction } from "../actions";
import { HumanVerificationModal } from "./HumanVerificationModal";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

const initialState = {
  success: false,
  error: null as string | null,
  fieldErrors: {} as Record<string, string[]>,
  data: null as { 
    message?: string;
    userId?: string;
    displayName?: string;
    email?: string;
    isEmailVerified?: boolean;
    roles?: string[];
  } | null,
};

interface SignupFormProps {
  tenantId?: string;
  language?: string;
  translations?: any;
}

export function SignupForm({ tenantId, language = 'en', translations }: SignupFormProps) {
  const router = useRouter();
  const t = translations || {
    fullName: 'Full Name',
    emailAddress: 'Email Address', 
    password: 'Password',
    fullNamePlaceholder: 'John Doe',
    emailPlaceholder: 'john@example.com',
    passwordPlaceholder: 'Enter a strong password',
    createAccount: 'Create Account',
    creatingAccount: 'Creating Account...',
    accountCreated: 'Account Created',
    humanVerificationCompleted: 'Human verification completed successfully',
    accountCreatedSuccess: 'Account created successfully! Please check your email for verification.',
    passwordRequirement: 'Password must be at least "Good" strength to continue',
    continueWithGoogle: 'Continue with Google',
    orContinueWith: 'or continue with email'
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formLoadTime] = useState(Date.now());
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formState, setFormState] = useState(initialState);
  const [formValues, setFormValues] = useState({
    displayName: '',
    email: '',
    password: ''
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google signup reuses the same OIDC handshake the login page uses
  // — the auth service's account.provider.findOrCreateGoogleUser
  // upserts a guest user (isEmailVerified mirrored from Google) and
  // resumes the OIDC interaction. After the session lands, the
  // header's ProfileSelectionDialog auto-opens for guests without a
  // profile, so no extra post-callback wiring is needed here.
  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      const returnUrl =
        typeof window !== 'undefined' ? window.location.origin : '/';
      await initiateLogin(returnUrl);
    } catch (err) {
      console.error('[Signup] Google signup initiation failed:', err);
      setFormState({
        ...initialState,
        error: err instanceof Error ? err.message : 'Google sign-up failed.',
      });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordStrength < 3) {
      return;
    }

    // Validate form fields before showing verification
    if (!formValues.displayName || !formValues.email || !formValues.password) {
      return;
    }

    if (!isVerified) {
      setShowVerification(true);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.append("verificationToken", verificationToken);
    formData.append("formLoadTime", formLoadTime.toString());
    if (tenantId) {
      formData.append("tenantId", tenantId);
    }

    setIsSubmitting(true);

    try {
      const result = await signupAction(initialState, formData);

      if (result.success && result.data?.email) {
        // Redirect on success
        router.push(`/success?email=${encodeURIComponent(result.data.email)}`);
      } else {
        // Update form state with errors
        setFormState(result);
        setIsSubmitting(false);
      }
    } catch (error) {
      setFormState({
        ...initialState,
        error: 'An unexpected error occurred. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true });
  };

  const handleVerificationComplete = async (token: string) => {
    setVerificationToken(token);
    setIsVerified(true);
    setShowVerification(false);

    // Auto-submit form after verification
    setIsSubmitting(true);

    // Create FormData from current form values
    const formData = new FormData();
    formData.append("displayName", formValues.displayName);
    formData.append("email", formValues.email);
    formData.append("password", formValues.password);
    formData.append("verificationToken", token);
    formData.append("formLoadTime", formLoadTime.toString());
    if (tenantId) {
      formData.append("tenantId", tenantId);
    }

    try {
      const result = await signupAction(initialState, formData);

      if (result.success && result.data?.email) {
        // Redirect on success
        router.push(`/success?email=${encodeURIComponent(result.data.email)}`);
      } else {
        // Update form state with errors
        setFormState(result);
        setIsSubmitting(false);
      }
    } catch (error) {
      setFormState({
        ...initialState,
        error: 'An unexpected error occurred. Please try again.'
      });
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return touched[fieldName] && formState.fieldErrors?.[fieldName]?.[0];
  };

  const getInputClasses = (fieldName: string) => {
    const hasError = getFieldError(fieldName);
    // Theme-aware focus ring — uses CSS variable so um1 fields focus
    // cardinal-red, UDM fields focus blue, etc. Arbitrary value has
    // no space inside the brackets (Tailwind JIT requirement).
    return `
      block w-full px-4 py-3 pl-12 border rounded-lg
      transition-all duration-200
      ${hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-[var(--color-primary,#2460B9)] focus:ring-[var(--color-primary,#2460B9)]'
      }
      focus:outline-none focus:ring-2 focus:ring-opacity-50
    `;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Allow Enter key to submit the form when not in a textarea
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      // Don't submit if password is too weak or not verified
      if (!isVerified || passwordStrength < 3) {
        e.preventDefault();
        if (!isVerified) {
          setShowVerification(true);
        }
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="space-y-6">
        {/* Success Message */}
        {formState.success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {t.accountCreatedSuccess}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {formState.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {formState.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Success */}
        {isVerified && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  {t.humanVerificationCompleted}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Google Sign-up — hands off to OIDC; auth service shows the
            Google option when GOOGLE_CLIENT_ID is set on the auth pod. */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading || isSubmitting || formState.success}
          className={`
            w-full flex justify-center items-center gap-3 py-3 px-4
            border border-gray-300 rounded-lg shadow-sm
            text-sm font-medium text-gray-700 bg-white
            transition-all duration-200
            ${isGoogleLoading || isSubmitting || formState.success
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:bg-gray-50 hover:shadow-md active:transform active:scale-[0.98]'
            }
          `}
          aria-label={t.continueWithGoogle}
        >
          {isGoogleLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.46-1.13 2.7-2.41 3.53v2.94h3.89c2.28-2.1 3.57-5.18 3.57-8.71z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.89-2.94c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.1-6.68-4.92H1.32v3.09C3.29 21.3 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.32 14.39c-.24-.72-.38-1.49-.38-2.39s.14-1.67.38-2.39V6.52H1.32A11.99 11.99 0 0 0 0 12c0 1.94.46 3.78 1.32 5.48l4-3.09z"/>
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.34 0 3.29 2.7 1.32 6.52l4 3.09C6.26 6.85 8.89 4.75 12 4.75z"/>
            </svg>
          )}
          {t.continueWithGoogle}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500">
              {t.orContinueWith}
            </span>
          </div>
        </div>

        {/* Full Name Field */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            {t.fullName}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              autoFocus
              required
              placeholder={t.fullNamePlaceholder}
              value={formValues.displayName}
              onChange={(e) => setFormValues({ ...formValues, displayName: e.target.value })}
              className={getInputClasses('displayName')}
              onBlur={() => handleFieldBlur('displayName')}
            />
          </div>
          {getFieldError('displayName') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('displayName')}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t.emailAddress}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t.emailPlaceholder}
              value={formValues.email}
              onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
              className={getInputClasses('email')}
              onBlur={() => handleFieldBlur('email')}
            />
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            {t.password}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFormValues({ ...formValues, password: e.target.value });
              }}
              className={`${getInputClasses('password')} pr-12`}
              onBlur={() => handleFieldBlur('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {getFieldError('password') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('password')}</p>
          )}
          
          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator 
            password={password} 
            onStrengthChange={setPasswordStrength}
          />
          
          {passwordStrength > 0 && passwordStrength < 3 && (
            <p className="mt-2 text-sm text-amber-600">
              {t.passwordRequirement}
            </p>
          )}
        </div>

        {/* Submit Button — uses theme primary so um1 stays cardinal,
            UDM stays blue, etc. */}
        <button
          type="submit"
          disabled={isSubmitting || formState.success || passwordStrength < 3}
          className={`
            w-full flex justify-center items-center py-3 px-4
            border border-transparent rounded-lg shadow-sm
            text-sm font-medium text-white
            transition-all duration-200
            ${isSubmitting || formState.success || passwordStrength < 3
              ? 'bg-gray-400 cursor-not-allowed'
              : 'hover:shadow-md hover:opacity-95 active:transform active:scale-[0.98]'
            }
          `}
          style={
            isSubmitting || formState.success || passwordStrength < 3
              ? undefined
              : { backgroundColor: 'var(--color-primary, #2460B9)' }
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              {t.creatingAccount}
            </>
          ) : formState.success ? (
            <>
              <CheckCircle2 className="-ml-1 mr-3 h-5 w-5 text-white" />
              {t.accountCreated}
            </>
          ) : (
            t.createAccount
          )}
        </button>
      </form>

      {/* Human Verification Modal */}
      {showVerification && (
        <HumanVerificationModal
          onComplete={handleVerificationComplete}
          onClose={() => setShowVerification(false)}
        />
      )}
    </>
  );
}