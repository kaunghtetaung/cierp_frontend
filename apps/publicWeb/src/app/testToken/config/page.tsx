import { Metadata } from "next";
import { TokenConfigClient } from "./TokenConfigClient";

export const metadata: Metadata = {
  title: "Token Configuration",
  description: "View and manage token lifetime and Redis TTL configuration",
};

export default function TokenConfigPage() {
  return <TokenConfigClient />;
}
