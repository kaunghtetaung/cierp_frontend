import { Suspense } from "react";
import { VerifyEmailClient } from "./VerifyEmailClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | Confirm Your Account",
  description: "Verify your email address to activate your account",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}