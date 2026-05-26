"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  ExternalLink,
} from "lucide-react";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface ContactPageClientProps {
  language: "en" | "mm";
  address: string;
  phone: string;
  email: string;
  openHours: string;
  mapEmbedUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  currentUser: CurrentUser | null;
}

const T = {
  en: {
    title: "Contact us",
    intro: "Send us a message and we'll get back to you.",
    form: {
      name: "Your name",
      email: "Email address",
      phone: "Phone (optional)",
      subject: "Subject",
      message: "Message",
      math: "Verification",
      submit: "Send message",
      sending: "Sending…",
      authPrompt:
        "You need an account to send a message. Sign up takes a few seconds.",
      signUp: "Sign up to send",
      success: "Thanks — your message has been sent.",
      genericError:
        "Something went wrong sending your message. Please try again.",
      verifyError: "Verification failed. Please try again.",
    },
    sidebar: {
      title: "Reach us",
      address: "Address",
      phone: "Phone",
      email: "Email",
      hours: "Open hours",
      directions: "Get directions",
    },
  },
  mm: {
    title: "ဆက်သွယ်ရန်",
    intro: "သင့်စာကိုပို့ပြီး ကျွန်ုပ်တို့ပြန်ဆက်သွယ်ပါမည်။",
    form: {
      name: "အမည်",
      email: "အီးမေးလ်",
      phone: "ဖုန်း (ရှိရင်)",
      subject: "ခေါင်းစဉ်",
      message: "စာသား",
      math: "အတည်ပြုခြင်း",
      submit: "ပို့ရန်",
      sending: "ပို့နေသည်…",
      authPrompt:
        "စာပို့ရန် အကောင့်တစ်ခု လိုအပ်သည်။ မှတ်ပုံတင်ခြင်းသည် ပုံမှန်အားဖြင့် တချို့စက္ကန့်သာ ကြာသည်။",
      signUp: "မှတ်ပုံတင်၍ ပို့ရန်",
      success: "ကျေးဇူးတင်ပါသည်။ သင့်စာကို လက်ခံပြီးပါပြီ။",
      genericError: "စာပို့ရာတွင် အမှားရှိနေပါသည်။ ထပ်မံကြိုးစားပါ။",
      verifyError: "အတည်ပြုခြင်း မအောင်မြင်ပါ။ ထပ်မံကြိုးစားပါ။",
    },
    sidebar: {
      title: "ဆက်သွယ်ရန်",
      address: "လိပ်စာ",
      phone: "ဖုန်း",
      email: "အီးမေးလ်",
      hours: "ဖွင့်ချိန်",
      directions: "လမ်းညွှန်",
    },
  },
};

interface MathChallenge {
  question: string;
  mathSeed: string;
}

export function ContactPageClient(props: ContactPageClientProps) {
  const {
    language,
    address,
    phone,
    email,
    openHours,
    mapEmbedUrl,
    latitude,
    longitude,
    currentUser,
  } = props;

  const t = T[language];
  const isAuthed = !!currentUser;
  const formMountedAtRef = useRef<number>(Date.now());

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    subject: "",
    message: "",
    honeypot: "",
    mathAnswer: "",
  });

  const [challenge, setChallenge] = useState<MathChallenge | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch a fresh math challenge on mount and reset the fill-time
  // anchor at the same moment.
  useEffect(() => {
    formMountedAtRef.current = Date.now();
    let cancelled = false;
    fetch("/api/public/contact/challenge", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        const data = json?.data;
        if (data?.mathSeed && data?.question) {
          setChallenge({
            question: String(data.question),
            mathSeed: String(data.mathSeed),
          });
        }
      })
      .catch(() => {
        /* form still works without a challenge — server falls
           back to honeypot + timing checks */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (key: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const goToSignUp = () => {
    const ret = encodeURIComponent("/contact");
    window.location.href = `/signup?return=${ret}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthed) {
      goToSignUp();
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          honeypot: formData.honeypot,
          mathAnswer:
            formData.mathAnswer.trim() === ""
              ? undefined
              : Number(formData.mathAnswer),
          mathSeed: challenge?.mathSeed,
          formStartedAt: formMountedAtRef.current,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData((prev) => ({
          ...prev,
          subject: "",
          message: "",
          mathAnswer: "",
        }));
      } else {
        const body = await res.json().catch(() => null);
        const code = body?.errorCode || body?.error;
        setErrorMsg(
          code === "CONTACT_VERIFICATION_FAILED"
            ? t.form.verifyError
            : t.form.genericError,
        );
      }
    } catch {
      setErrorMsg(t.form.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="w-full">
      {/* Hero */}
      <section className="w-full" style={{ backgroundColor: "var(--color-page-bg, transparent)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{
              color: "var(--color-foreground)",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t.title}
          </h1>
          <span
            className="block mt-4 h-0.5 w-16"
            style={{ backgroundColor: "var(--color-primary)" }}
            aria-hidden
          />
          <p
            className="mt-4 max-w-2xl text-base md:text-lg"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {t.intro}
          </p>
        </div>
      </section>

      {/* Two-column body */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-7">
            {success ? (
              <div
                className="rounded-md border p-6 flex items-start gap-3"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card-bg, transparent)",
                }}
              >
                <CheckCircle2
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--color-primary)" }}
                />
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {t.form.success}
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
                aria-label={t.title}
              >
                {!isAuthed && (
                  <div
                    className="rounded-md border p-4 flex items-start gap-3"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-muted, transparent)",
                    }}
                  >
                    <UserPlus
                      className="h-5 w-5 mt-0.5 flex-shrink-0"
                      style={{ color: "var(--color-primary)" }}
                    />
                    <div className="text-sm leading-relaxed">
                      {t.form.authPrompt}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={t.form.name} required>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      readOnly={isAuthed}
                      value={formData.name}
                      onChange={onChange("name")}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={t.form.email} required>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      readOnly={isAuthed}
                      value={formData.email}
                      onChange={onChange("email")}
                      className={fieldClass}
                    />
                  </Field>
                </div>

                <Field label={t.form.phone}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={onChange("phone")}
                    className={fieldClass}
                  />
                </Field>

                <Field label={t.form.subject} required>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={200}
                    value={formData.subject}
                    onChange={onChange("subject")}
                    className={fieldClass}
                  />
                </Field>

                <Field label={t.form.message} required>
                  <textarea
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    value={formData.message}
                    onChange={onChange("message")}
                    className={`${fieldClass} resize-y min-h-[140px]`}
                  />
                </Field>

                {/* Math challenge */}
                {challenge && (
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:items-end">
                    <Field label={`${t.form.math}: ${challenge.question}`} required>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        value={formData.mathAnswer}
                        onChange={onChange("mathAnswer")}
                        className={`${fieldClass} max-w-[160px]`}
                      />
                    </Field>
                  </div>
                )}

                {/* Honeypot — hidden from users via inline style + aria.
                    Bots that auto-fill every input will populate it,
                    and the server rejects any non-empty value. */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "-9999px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden",
                  }}
                >
                  <label>
                    Website (leave empty)
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={onChange("honeypot")}
                    />
                  </label>
                </div>

                {errorMsg && (
                  <div
                    className="rounded-md border p-3 flex items-start gap-2 text-sm"
                    style={{
                      borderColor: "var(--color-destructive, #b91c1c)",
                      color: "var(--color-destructive, #b91c1c)",
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold uppercase tracking-wider text-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground, #fff)",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.form.sending}
                      </>
                    ) : isAuthed ? (
                      <>
                        <Send className="h-4 w-4" />
                        {t.form.submit}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        {t.form.signUp}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Sidebar — contact info + map */}
          <aside className="lg:col-span-5">
            <div
              className="rounded-md border overflow-hidden"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card-bg, rgba(0,0,0,0.02))",
              }}
            >
              <div className="px-5 py-5 md:px-6 md:py-6">
                <h2
                  className="text-sm font-bold uppercase tracking-[0.18em] mb-4 flex items-center gap-2.5"
                  style={{ color: "var(--color-foreground)" }}
                >
                  <span
                    className="inline-block h-px w-5"
                    style={{ backgroundColor: "var(--color-primary)" }}
                    aria-hidden
                  />
                  {t.sidebar.title}
                </h2>
                <ul className="space-y-4 text-sm">
                  {address && (
                    <SidebarRow icon={MapPin} label={t.sidebar.address}>
                      <span className="whitespace-pre-line">{address}</span>
                    </SidebarRow>
                  )}
                  {phone && (
                    <SidebarRow icon={Phone} label={t.sidebar.phone}>
                      <a href={`tel:${phone}`} className="hover:underline">
                        {phone}
                      </a>
                    </SidebarRow>
                  )}
                  {email && (
                    <SidebarRow icon={Mail} label={t.sidebar.email}>
                      <a
                        href={`mailto:${email}`}
                        className="hover:underline break-all"
                      >
                        {email}
                      </a>
                    </SidebarRow>
                  )}
                  {openHours && (
                    <SidebarRow icon={Clock} label={t.sidebar.hours}>
                      <span className="whitespace-pre-line">{openHours}</span>
                    </SidebarRow>
                  )}
                </ul>
              </div>

              {mapEmbedUrl && (
                <div className="border-t" style={{ borderColor: "var(--color-border)" }}>
                  <iframe
                    src={mapEmbedUrl}
                    title="Google Map"
                    width="100%"
                    height="280"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  {latitude != null && longitude != null && (
                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {t.sidebar.directions}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default ContactPageClient;

// ── Styling helpers ──────────────────────────────────────────────

const fieldClass =
  "w-full rounded-md border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block mb-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-foreground)" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--color-primary)" }}> *</span>
        )}
      </span>
      {children}
    </label>
  );
}

function SidebarRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: "var(--color-muted, rgba(0,0,0,0.05))",
          color: "var(--color-foreground)",
        }}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[0.7rem] font-semibold uppercase tracking-wider mb-0.5"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {label}
        </div>
        <div style={{ color: "var(--color-foreground)" }}>{children}</div>
      </div>
    </li>
  );
}
