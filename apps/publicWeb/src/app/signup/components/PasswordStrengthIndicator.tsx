"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import styles from "../styles/signup.module.css";

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

interface StrengthCriteria {
  label: string;
  test: (password: string) => boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  onStrengthChange 
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState(0);

  const criteria: StrengthCriteria[] = [
    {
      label: "At least 8 characters",
      test: (pwd) => pwd.length >= 8,
    },
    {
      label: "Contains uppercase letter",
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      label: "Contains lowercase letter", 
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      label: "Contains number",
      test: (pwd) => /\d/.test(pwd),
    },
    {
      label: "Contains special character",
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    },
  ];

  useEffect(() => {
    const passedCriteria = criteria.filter(c => c.test(password)).length;
    setStrength(passedCriteria);
    onStrengthChange?.(passedCriteria);
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return "";
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const getStrengthClass = () => {
    if (password.length === 0) return "";
    if (strength <= 1) return styles.strengthWeak;
    if (strength <= 2) return styles.strengthFair;
    if (strength <= 3) return styles.strengthGood;
    if (strength <= 4) return styles.strengthStrong;
    return styles.strengthVeryStrong;
  };

  const getStrengthTextColor = () => {
    if (strength <= 1) return "var(--signup-error)";
    if (strength <= 2) return "#f97316";
    if (strength <= 3) return "#eab308";
    if (strength <= 4) return "var(--signup-primary)";
    return "var(--signup-success)";
  };

  if (!password) return null;

  return (
    <div className={styles.strengthContainer}>
      {/* Strength Bar */}
      <div>
        <div className={styles.strengthHeader}>
          <span className={styles.strengthLabel}>Password strength</span>
          <span 
            className={styles.strengthValue}
            style={{ color: getStrengthTextColor() }}
          >
            {getStrengthLabel()}
          </span>
        </div>
        <div className={styles.strengthBar}>
          <div 
            className={`${styles.strengthFill} ${getStrengthClass()}`}
            style={{ width: `${(strength / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      <div className={styles.criteriaList}>
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <div 
              key={index}
              className={`${styles.criteriaItem} ${passed ? styles.passed : ''}`}
            >
              {passed ? (
                <Check className={`${styles.criteriaIcon} ${styles.success}`} />
              ) : (
                <X className={`${styles.criteriaIcon} ${styles.pending}`} />
              )}
              <span className={`${styles.criteriaText} ${passed ? styles.passed : ''}`}>
                {criterion.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}