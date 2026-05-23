"use client";

/**
 * Password gate UI for password-protected posts.
 *
 * Rendered in place of the post body when:
 *   - the backend marks the post `visibility: 'Password'`, AND
 *   - no valid `pw_<postId>` unlock cookie was supplied with the request.
 *
 * Submits the password via the `unlockPost` server action; on success
 * the server action sets the unlock cookie and `revalidatePath`s the
 * route, so the parent server component refetches and renders the
 * actual post body on the next render.
 */
import { useState, useTransition } from "react";
import {
  unlockPost,
  type UnlockResult,
} from "@/app/(cms)/post/[type]/[slug]/unlock-action";

type LangKey = "en" | "mm";

interface PasswordGateProps {
  postId: string;
  slug: string;
  type: string;
  title?: string;
  currentLanguage: LangKey;
}

const MESSAGES: Record<
  LangKey,
  {
    title: string;
    hint: string;
    placeholder: string;
    submit: string;
    submitting: string;
    invalid: string;
    missing: string;
    network: string;
    config: string;
  }
> = {
  en: {
    title: "Password protected",
    hint: "This post is password protected. Enter the password to view its contents.",
    placeholder: "Password",
    submit: "Unlock",
    submitting: "Unlocking…",
    invalid: "That password didn't match. Please try again.",
    missing: "Please enter a password.",
    network: "We couldn't reach the server. Please try again.",
    config: "Password unlock is not configured. Contact the site admin.",
  },
  mm: {
    title: "စကားဝှက် ကာကွယ်ထား",
    hint: "ဤပို့စ်ကို စကားဝှက်ဖြင့် ကာကွယ်ထားသည်။ ဖတ်ရှုရန် စကားဝှက် ထည့်ပါ။",
    placeholder: "စကားဝှက်",
    submit: "ဖွင့်မည်",
    submitting: "ဖွင့်နေသည်…",
    invalid: "စကားဝှက် မှားနေပါသည်။ ထပ်စမ်းကြည့်ပါ။",
    missing: "စကားဝှက် ထည့်ပါ။",
    network: "ဆာဗာသို့ မဆက်နိုင်ပါ။ ထပ်စမ်းကြည့်ပါ။",
    config: "စကားဝှက်ဖွင့်ခြင်း မရှိသေးပါ။ စီမံခန့်ခွဲသူကို ဆက်သွယ်ပါ။",
  },
};

function pickError(
  result: UnlockResult | null,
  m: (typeof MESSAGES)[LangKey],
): string | null {
  if (!result || result.success) return null;
  switch (result.errorCode) {
    case "INVALID_PASSWORD":
      return m.invalid;
    case "MISSING_PASSWORD":
      return m.missing;
    case "CONFIG":
      return m.config;
    case "NETWORK":
    default:
      return m.network;
  }
}

export function PasswordGate({
  postId,
  slug,
  type,
  title,
  currentLanguage,
}: PasswordGateProps) {
  const m = MESSAGES[currentLanguage] ?? MESSAGES.en;
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<UnlockResult | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!password) {
      setResult({ success: false, errorCode: "MISSING_PASSWORD" });
      return;
    }
    startTransition(async () => {
      const next = await unlockPost(postId, slug, type, password);
      setResult(next);
      if (next.success) {
        setPassword("");
        // revalidatePath inside the action triggers a re-render. The
        // form remains mounted until React swaps the page out.
      }
    });
  }

  const errorMessage = pickError(result, m);

  return (
    <div className="mx-auto my-12 max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {/* lock icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-5 w-5"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {m.title}
          </h2>
          {title ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          ) : null}
        </div>
      </div>
      <p className="mb-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {m.hint}
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={m.placeholder}
          aria-invalid={!!errorMessage}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          disabled={pending}
        />
        {errorMessage ? (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errorMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? m.submitting : m.submit}
        </button>
      </form>
    </div>
  );
}

export default PasswordGate;
