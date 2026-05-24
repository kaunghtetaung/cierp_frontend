import React from "react";

/**
 * Login layout — intentionally chromeless.
 *
 * The login route is just a thin OIDC initiator: it fires the
 * `initiateLogin()` flow on mount and shows a spinner while the
 * browser redirects to the auth provider. There's no actual page
 * content, so wrapping it with the tenant-themed `SiteShellLayout`
 * (header / footer / nav) was misleading — it implied this was a
 * styled tenant page when it's really a transient redirect.
 *
 * Keep the layout minimal so the spinner is centred on a clean
 * background regardless of which tenant the visitor came from.
 */

export const dynamic = "force-dynamic";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
