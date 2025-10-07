import { Metadata } from "next";
import { getCurrentUser } from "@repo/auth/server-api";
import { TestTokenClient } from "./TestTokenClient";

export const metadata: Metadata = {
  title: "Token Test Page",
  description: "Test token renewal and session management",
};

export default async function TestTokenPage() {
  const user = await getCurrentUser();

  return <TestTokenClient user={user} />;
}
