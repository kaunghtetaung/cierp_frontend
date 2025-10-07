"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Mail, UserCircle, Lock, Eye, EyeOff } from "lucide-react";
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
    passwordRequirement: 'Password must be at least "Good" strength to continue'
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
    return `
      block w-full px-4 py-3 pl-12 border rounded-lg 
      transition-all duration-200
      ${hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
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

        {/* Submit Button */}
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
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.98]'
            }
          `}
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