"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./styles/verify-email.module.css";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setMessage("No verification token provided");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      // Call the server action
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
        setMessage(data.message || "Your email has been successfully verified!");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to verify email. Please try again.");
      }
    } catch (error) {
      console.error("Email verification error:", error);
      setStatus("error");
      setMessage("An error occurred while verifying your email. Please try again.");
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.verificationCard}>
          {/* Logo */}
          <div className={styles.logoWrapper}>
            <Mail className={styles.logo} />
          </div>

          {/* Status Icon */}
          <div className={styles.statusIcon}>
            {status === "loading" && (
              <div className={styles.loadingIcon}>
                <Loader2 className={styles.spinner} size={48} />
              </div>
            )}
            {status === "success" && (
              <div className={styles.successIcon}>
                <CheckCircle2 size={48} />
              </div>
            )}
            {(status === "error" || status === "invalid") && (
              <div className={styles.errorIcon}>
                <XCircle size={48} />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className={styles.title}>
            {status === "loading" && "Verifying Your Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
            {status === "invalid" && "Invalid Link"}
          </h1>

          {/* Message */}
          <p className={styles.message}>{message}</p>

          {/* Additional Info */}
          {status === "loading" && (
            <p className={styles.subMessage}>
              Please wait while we verify your email address...
            </p>
          )}

          {status === "success" && (
            <>
              <p className={styles.subMessage}>
                You will be redirected to the login page in a few seconds...
              </p>
              <Link href="/login" className={styles.button}>
                <span>Go to Login</span>
                <ArrowRight size={16} />
              </Link>
            </>
          )}

          {(status === "error" || status === "invalid") && (
            <div className={styles.errorActions}>
              <p className={styles.subMessage}>
                The verification link may have expired or is invalid.
              </p>
              <div className={styles.buttonGroup}>
                <Link href="/signup" className={styles.buttonSecondary}>
                  Sign Up Again
                </Link>
                <Link href="/login" className={styles.button}>
                  Go to Login
                </Link>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Having trouble? <Link href="/contact" className={styles.link}>Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}