import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { getContentSettings } from "@repo/content";
import { HeaderDefault } from "./variants/HeaderDefault";
import { HeaderModern } from "./variants/HeaderModern";
import { HeaderMinimal } from "./variants/HeaderMinimal";

interface HeaderContainerProps {
  currentLanguage?: "en" | "mm";
}

const HEADER_VARIANTS = {
  default: HeaderDefault,
  modern: HeaderModern,
  minimal: HeaderMinimal,
} as const;

type HeaderVariantName = keyof typeof HEADER_VARIANTS;

function resolveVariant(input: unknown): HeaderVariantName {
  if (typeof input === "string" && input in HEADER_VARIANTS) {
    return input as HeaderVariantName;
  }
  return "default";
}

/**
 * Header dispatcher — reads `settings.header.variant` and mounts
 * the matching variant component. Unknown variants fall back to
 * the Default (Stanford-style) renderer.
 *
 * Each variant fetches the same settings doc again internally; the
 * lookup is React-cached per tenant so the extra call is free.
 */
export async function HeaderContainer({
  currentLanguage = "en",
}: HeaderContainerProps) {
  const middleware = await getMiddlewareDataFromHeaders().catch(() => null);
  const tenantId = middleware?.tenantId;

  let variantName: HeaderVariantName = "default";
  if (tenantId) {
    const settings = await getContentSettings(tenantId).catch(() => null);
    variantName = resolveVariant((settings as any)?.header?.variant);
  }

  const Component = HEADER_VARIANTS[variantName];
  return <Component currentLanguage={currentLanguage} />;
}

export default HeaderContainer;
