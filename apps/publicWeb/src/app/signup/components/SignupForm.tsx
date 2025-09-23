"use client";

import { useState, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Mail, UserCircle, Lock, Eye, EyeOff } from "lucide-react";
import { signupAction } from "../actions";
import { HumanVerificationModal } from "./HumanVerificationModal";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import styles from "../styles/signup.module.css";

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
  const [state, formAction] = useActionState(signupAction as any, initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formLoadTime] = useState(Date.now()); // Track when form was loaded
  
  // Form fields state for validation feedback
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Handle form submission state
  useEffect(() => {
    if (state.success || state.error) {
      setIsSubmitting(false);
      if (state.success && state.data?.email) {
        // Redirect to success page with email parameter
        router.push(`/signup/success?email=${encodeURIComponent(state.data.email)}`);
      }
    }
  }, [state, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if human verification is completed
    if (!isVerified) {
      setShowVerification(true);
      return;
    }

    // Check password strength
    if (passwordStrength < 3) {
      return; // Don't submit if password is too weak
    }

    // Get form data
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Add verification token, form load time, and tenant ID to form data
    formData.append("verificationToken", verificationToken);
    formData.append("formLoadTime", formLoadTime.toString());
    if (tenantId) {
      formData.append("tenantId", tenantId);
    }
    
    setIsSubmitting(true);
    await formAction(formData);
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched({ ...touched, [fieldName]: true });
  };

  const handleVerificationComplete = (token: string) => {
    setIsVerified(true);
    setVerificationToken(token);
    setShowVerification(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Display Name Field */}
        <div className={styles.formField}>
          <label htmlFor="displayName" className={styles.label}>
            <UserCircle className={styles.labelIcon} />
            {t.fullName}
            <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder={t.fullNamePlaceholder}
              onBlur={() => handleFieldBlur("displayName")}
              className={`${styles.input} ${state.fieldErrors?.displayName ? styles.error : ""}`}
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>
          {state.fieldErrors?.displayName && touched.displayName && (
            <p className={styles.errorMessage}>{state.fieldErrors.displayName[0]}</p>
          )}
        </div>

        {/* Email Field */}
        <div className={styles.formField}>
          <label htmlFor="email" className={styles.label}>
            <Mail className={styles.labelIcon} />
            {t.emailAddress}
            <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t.emailPlaceholder}
              onBlur={() => handleFieldBlur("email")}
              className={`${styles.input} ${state.fieldErrors?.email ? styles.error : ""}`}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          {state.fieldErrors?.email && touched.email && (
            <p className={styles.errorMessage}>{state.fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password Field */}
        <div className={styles.formField}>
          <label htmlFor="password" className={styles.label}>
            <Lock className={styles.labelIcon} />
            {t.password}
            <span className={styles.required}>*</span>
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleFieldBlur("password")}
              className={`${styles.input} ${styles.inputWithIcon} ${state.fieldErrors?.password ? styles.error : ""}`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.toggleButton}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator 
            password={password} 
            onStrengthChange={setPasswordStrength}
          />
          
          {state.fieldErrors?.password && touched.password && (
            <p className={styles.errorMessage}>{state.fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Honeypot Field - Hidden from users, visible to bots */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="website">
            Website
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        {/* Human Verification Status */}
        {isVerified && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle2 className={styles.alertIcon} />
            <span>Human verification completed successfully</span>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle className={styles.alertIcon} />
            <span>{state.error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting || passwordStrength < 3}
        >
          {isSubmitting ? (
            <>
              <Loader2 className={styles.spinner} size={16} />
              {t.creatingAccount}
            </>
          ) : (
            t.createAccount
          )}
        </button>

        {passwordStrength > 0 && passwordStrength < 3 && (
          <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--signup-text-muted)', marginTop: '0.5rem' }}>
            Password must be at least "Good" strength to continue
          </p>
        )}
      </form>

      {/* Human Verification Modal */}
      {showVerification && !isVerified && (
        <HumanVerificationModal
          onVerified={handleVerificationComplete}
          onClose={() => setShowVerification(false)}
        />
      )}
    </>
  );
}