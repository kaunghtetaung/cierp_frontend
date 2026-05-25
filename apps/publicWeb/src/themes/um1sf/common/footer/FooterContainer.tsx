import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { FooterDefault } from "./variants/FooterDefault";
import { FooterModern } from "./variants/FooterModern";
import { FooterMinimal } from "./variants/FooterMinimal";

interface FooterContainerProps {
  currentLanguage?: "en" | "mm";
}

const FOOTER_VARIANTS = {
  default: FooterDefault,
  modern: FooterModern,
  minimal: FooterMinimal,
} as const;

type FooterVariantName = keyof typeof FOOTER_VARIANTS;

function resolveVariant(input: unknown): FooterVariantName {
  if (typeof input === "string" && input in FOOTER_VARIANTS) {
    return input as FooterVariantName;
  }
  return "default";
}

/**
 * Footer dispatcher — reads `settings.footer.variant` and mounts
 * the matching variant component. Unknown variants fall back to
 * Default.
 */
export async function FooterContainer({
  currentLanguage = "en",
}: FooterContainerProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  let variantName: FooterVariantName = "default";
  if (tenantId) {
    const settings = await getContentSettings(tenantId).catch(() => null);
    variantName = resolveVariant((settings as any)?.footer?.variant);
  }

  const Component = FOOTER_VARIANTS[variantName];
  return <Component currentLanguage={currentLanguage} />;
}

export default FooterContainer;
