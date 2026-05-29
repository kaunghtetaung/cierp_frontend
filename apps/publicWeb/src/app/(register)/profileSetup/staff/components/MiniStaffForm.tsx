"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserCircle,
  Phone,
  Briefcase,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  submitStaffSelfRegistration,
  updateMyStaffProfile,
  listAppointmentTypes,
  listAppointmentsByType,
  listDepartments,
  type StaffSelfRegistrationData,
} from "../staff-actions";
// Reuse the polished input widgets the student form ships with. They
// are presentation-only (value / onChange / error) so they slot into
// our useState-based form without needing react-hook-form.
import { PublicNrcField } from "../../student/components/PublicNrcField";
import { PlaceOfBirthTypeAhead } from "../../student/components/PlaceOfBirthTypeAhead";
import { StudentPhotoUpload } from "../../student/components/StudentPhotoUpload";

interface MiniStaffFormProps {
  user: any;
  initialProfile?: any;
  /** When true, the user already has a server-stored Staff record and
   *  submitting should PATCH `/cpms/staffs/me` instead of POSTing
   *  `/self-register` (which would 409 on duplicate). Same pattern the
   *  Full wizard uses. */
  isUpdate?: boolean;
  /** Receives the current in-form values so the parent can copy them
   *  into the Full wizard before switching modes. Lets users switch
   *  without losing what they've typed. */
  onSwitchToFull?: (currentValues: any) => void;
}

interface RefOption {
  _id: string;
  name?: { en?: string; mm?: string } | string;
  code?: string;
  fullName?: string;
  displayName?: { en?: string; mm?: string };
}

/**
 * Mini staff registration form. Collects exactly the fields specified
 * for Mini mode:
 *   Identity:    name (En + Mm), NRC, DOB, photo
 *   Contact:     phone, email, current address, place of birth
 *   Family:      father name (En + Mm only — no NRC/phone/occupation)
 *   Employment:  AppointmentType → Appointment (cascading), Department,
 *                current appointment start date, service start date
 *   Education:   list of degrees (repeater — degree + institution + year)
 *   Public:      short bio (en/mm)
 *
 * All theme colours come from `var(--color-primary)` so each tenant's
 * brand bleeds through. Submit hands off to
 * `POST /cpms/staffs/self-register`; backend stamps `pending`.
 */
export function MiniStaffForm({ user, initialProfile, isUpdate = false, onSwitchToFull }: MiniStaffFormProps) {
  const router = useRouter();
  const primary = "var(--color-primary, #2460B9)";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Cascading dropdown data
  const [appointmentTypes, setAppointmentTypes] = useState<RefOption[]>([]);
  const [appointments, setAppointments] = useState<RefOption[]>([]);
  const [departments, setDepartments] = useState<RefOption[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // localStorage draft key — scoped per user so multiple accounts
  // sharing a browser don't trample each other's drafts. Tenant
  // included so an admin who jumps tenants doesn't see their other
  // tenant's draft. SSR-safe via the typeof window guard.
  const draftKey =
    user?.id && user?.tenantId
      ? `mini-staff-draft:${user.tenantId}:${user.id}`
      : null;
  // Draft TTL — anything older than 14 days is treated as stale and
  // discarded on load (HR workflows are bursty; a half-year-old draft
  // is more confusing than helpful).
  const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;

  // Initial form state — `initialProfile` (from props) wins, then a
  // browser-cached draft for the same user, then blank.
  //
  // Lazy initializer (`useState(() => ...)`) runs once on mount and
  // synchronously seeds the state, so the first paint already shows
  // the restored values — no flash-of-empty-fields.
  const [form, setForm] = useState(() => {
    const baseline: any = {
      nameEnglish: initialProfile?.nameEnglish || "",
      nameMyanmar: initialProfile?.nameMyanmar || "",
      nrcNumber: initialProfile?.nrcNumber || "",
      dateOfBirth: initialProfile?.dateOfBirth ? initialProfile.dateOfBirth.slice(0, 10) : "",
      phoneNumber: initialProfile?.phoneNumber || "",
      email: initialProfile?.email || user?.email || "",
      currentAddress: initialProfile?.currentAddress || "",
      placeOfBirth: initialProfile?.placeOfBirth || "",
      appointmentTypeId:
        (initialProfile as any)?.appointmentTypeId ||
        (typeof initialProfile?.primaryAppointmentId === "object"
          ? typeof initialProfile.primaryAppointmentId?.appointmentTypeId === "object"
            ? initialProfile.primaryAppointmentId.appointmentTypeId._id
            : initialProfile.primaryAppointmentId?.appointmentTypeId
          : "") ||
        "",
      primaryAppointmentId:
        typeof initialProfile?.primaryAppointmentId === "object"
          ? initialProfile.primaryAppointmentId?._id || ""
          : initialProfile?.primaryAppointmentId || "",
      primaryDepartmentId:
        typeof initialProfile?.primaryDepartmentId === "object"
          ? initialProfile.primaryDepartmentId?._id || ""
          : initialProfile?.primaryDepartmentId || "",
      // UI-only filter — Department Type narrows the Department
      // dropdown to academic vs administrative entries. Not part of
      // the submitted payload; the Department record itself already
      // carries `type` and reporting derives from there.
      departmentTypeFilter:
        typeof initialProfile?.primaryDepartmentId === "object"
          ? initialProfile.primaryDepartmentId?.type || ""
          : "",
      appointmentDate: initialProfile?.appointmentDate
        ? initialProfile.appointmentDate.slice(0, 10)
        : "",
      firstJoinDate: initialProfile?.firstJoinDate
        ? initialProfile.firstJoinDate.slice(0, 10)
        : "",
      profilePhoto: initialProfile?.profilePhoto || "",
    };

    // initialProfile takes precedence — if the user already has a
    // server-stored record, that's the source of truth; the cache is
    // only for unsubmitted typing.
    if (initialProfile || !draftKey) return baseline;

    if (typeof window === "undefined") return baseline;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return baseline;
      const parsed = JSON.parse(raw);
      if (!parsed?.savedAt || !parsed?.values) return baseline;
      if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
        window.localStorage.removeItem(draftKey);
        return baseline;
      }
      // Merge baseline (defaults) with the saved values so any field
      // we added later still gets a defined string instead of
      // undefined controlled-input warnings.
      return { ...baseline, ...parsed.values };
    } catch {
      return baseline;
    }
  });

  // One-shot mount diagnostic — confirms whether the server-fetched
  // `initialProfile` actually reached the form. If a returning user
  // sees an empty form, the console will say `hasInitialProfile=false`
  // and we know to chase the action / page rather than the form.
  useEffect(() => {
    console.log("[MiniStaffForm] mounted", {
      hasInitialProfile: Boolean(initialProfile),
      isUpdate,
      keysOnInitial: initialProfile ? Object.keys(initialProfile).slice(0, 12) : [],
      seedNameEnglish: (initialProfile as any)?.nameEnglish,
      seedNrcNumber: (initialProfile as any)?.nrcNumber,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save the form to localStorage on every change. Debounced
  // via a 500ms timer so typing fast doesn't pound localStorage.
  // Saves are skipped on submit success (clear instead) and when
  // there's no key (anonymous render).
  useEffect(() => {
    if (!draftKey) return;
    if (success) return; // post-submit cleanup handles it
    if (typeof window === "undefined") return;
    // Skip the no-op initial mount when the form is exactly the
    // server-loaded record — no draft to save until the user types.
    const isEmptyDraft = Object.values(form).every(
      (v) => v === "" || v === undefined || v === null,
    );
    if (isEmptyDraft && !initialProfile) return;
    const handle = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ savedAt: Date.now(), values: form }),
        );
      } catch {
        /* Quota errors etc — non-critical */
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [form, draftKey, success, initialProfile]);

  // Flag a "Draft restored" banner on first mount when a cache load
  // happened — gives the user awareness without being intrusive.
  useEffect(() => {
    if (!draftKey || initialProfile) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.values && Object.values(parsed.values).some((v) => v))
          setDraftRestored(true);
      }
    } catch {
      /* no-op */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearDraft = () => {
    if (!draftKey || typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* no-op */
    }
  };

  // Load AppointmentTypes on mount
  useEffect(() => {
    (async () => {
      setLoadingTypes(true);
      const r = await listAppointmentTypes();
      if (r.success) {
        setAppointmentTypes(r.data as any);
      } else {
        // Surface the error so the user knows something failed — empty
        // dropdowns with no feedback is the worst possible UX.
        console.error("[MiniStaffForm] AppointmentTypes load failed:", r.error);
        setError(
          `Couldn't load appointment types (${r.error || "unknown"}). Check that the CPMS service is running and refresh the page.`,
        );
      }
      setLoadingTypes(false);
    })();
  }, []);

  // Load Departments on mount
  useEffect(() => {
    (async () => {
      const r = await listDepartments();
      if (r.success) {
        setDepartments(r.data as any);
      } else {
        console.error("[MiniStaffForm] Departments load failed:", r.error);
      }
    })();
  }, []);

  // When user picks an AppointmentType, refetch Appointments under it
  useEffect(() => {
    if (!form.appointmentTypeId) {
      setAppointments([]);
      return;
    }
    (async () => {
      setLoadingAppointments(true);
      const r = await listAppointmentsByType(form.appointmentTypeId);
      if (r.success) {
        setAppointments(r.data as any);
        // Auto-pick if there's exactly one — common for the default
        // seeded appointment under each type.
        if ((r.data as any).length === 1) {
          setForm((f) => ({ ...f, primaryAppointmentId: (r.data as any)[0]._id }));
        }
      }
      setLoadingAppointments(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.appointmentTypeId]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end required fields
    if (!form.nameEnglish || !form.nameMyanmar || !form.nrcNumber || !form.dateOfBirth) {
      setError("Please fill in name (English + Myanmar), NRC, and date of birth.");
      return;
    }
    if (!form.primaryAppointmentId) {
      setError("Please pick your appointment type and position.");
      return;
    }
    if (!form.appointmentDate) {
      setError("Please enter your current appointment start date.");
      return;
    }

    const payload: StaffSelfRegistrationData = {
      nameEnglish: form.nameEnglish.trim(),
      nameMyanmar: form.nameMyanmar.trim(),
      nrcNumber: form.nrcNumber.trim(),
      dateOfBirth: form.dateOfBirth,
      phoneNumber: form.phoneNumber || undefined,
      email: form.email || undefined,
      currentAddress: form.currentAddress || undefined,
      placeOfBirth: form.placeOfBirth || undefined,
      primaryAppointmentId: form.primaryAppointmentId,
      primaryDepartmentId: form.primaryDepartmentId || undefined,
      appointmentDate: form.appointmentDate,
      firstJoinDate: form.firstJoinDate || undefined,
      profilePhoto: form.profilePhoto || undefined,
    };

    setSubmitting(true);
    const result = isUpdate
      ? await updateMyStaffProfile(payload, initialProfile?._id)
      : await submitStaffSelfRegistration(payload);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Submission failed. Please try again.");
      return;
    }

    setSuccess(true);
    // Cached draft is no longer useful — the server record is
    // canonical now.
    clearDraft();
    // Brief delay so user sees the success banner before navigation
    setTimeout(() => {
      router.push("/profile/staff");
    }, 1200);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ backgroundColor: primary }}
          >
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isUpdate ? "Updated!" : "Submitted!"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isUpdate
              ? "Your changes have been saved. We'll redirect you to your profile page shortly."
              : "Your staff profile is pending HR approval. We'll redirect you to your profile page shortly."}
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: primary }} />
        </div>
      </div>
    );
  }

  const inputClass =
    "block w-full h-9 px-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-[var(--color-primary,#2460B9)] focus:ring-1 focus:ring-[var(--color-primary,#2460B9)]";
  const iconInputWrap = "relative";
  const iconInside =
    "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none";

  // Compact field-group helpers — eliminate the per-field <label> +
  // wrapper div boilerplate that bloated the original layout.
  const labelClass = "block text-[11px] font-medium text-gray-600 mb-1";
  const sectionTitle =
    "text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100";

  // Snapshot the current form state for the Mini → Full handoff.
  // Maps the flat useState shape back to the API DTO so the Full
  // wizard's `initialProfile` prop can hydrate without translation.
  const buildCurrentValues = () => ({
    nameEnglish: form.nameEnglish,
    nameMyanmar: form.nameMyanmar,
    nrcNumber: form.nrcNumber,
    dateOfBirth: form.dateOfBirth,
    phoneNumber: form.phoneNumber,
    email: form.email,
    currentAddress: form.currentAddress,
    placeOfBirth: form.placeOfBirth,
    profilePhoto: form.profilePhoto,
    // Include appointmentTypeId — not part of the API DTO but the
    // Full wizard's local state needs it to pre-select the Step-1
    // dropdown of the cascading position picker. Extra keys are
    // harmless when the payload eventually goes to PATCH /me.
    appointmentTypeId: form.appointmentTypeId,
    primaryAppointmentId: form.primaryAppointmentId,
    primaryDepartmentId: form.primaryDepartmentId,
    appointmentDate: form.appointmentDate,
    firstJoinDate: form.firstJoinDate,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {draftRestored && (
        <div
          className="mb-3 rounded-md p-2.5 flex items-start gap-2 border-l-2"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-primary, #2460B9) 6%, transparent)",
            borderLeftColor: primary,
          }}
        >
          <CheckCircle2
            className="h-4 w-4 flex-shrink-0 mt-0.5"
            style={{ color: primary }}
          />
          <div className="flex-1 flex items-center justify-between gap-3 text-xs">
            <p className="text-gray-700">
              Picking up where you left off. Your previous draft has been
              restored.
            </p>
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setDraftRestored(false);
                window.location.reload();
              }}
              className="font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap underline-offset-2 hover:underline"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-2.5 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 space-y-5"
      >
        {/* ───── Identity — photo (left) + 3-col field grid (right).
                With max-w-5xl the right side has enough room for Name
                En / Name Mm / DOB on a single row, with NRC + Place
                of Birth on the next. Photo column is fixed-width so
                names don't crowd next to it on small screens. ───── */}
        <section>
          <h2 className={sectionTitle}>Identity</h2>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <StudentPhotoUpload
                value={form.profilePhoto}
                onChange={(v) => update("profilePhoto", v)}
                tenantId={user?.tenantId || ""}
                appId="publicWeb"
                size="sm"
              />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Full Name (English) *</label>
                <div className={iconInputWrap}>
                  <div className={iconInside}>
                    <UserCircle className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.nameEnglish}
                    onChange={(e) => update("nameEnglish", e.target.value)}
                    required
                    placeholder="John Doe"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Full Name (Myanmar) *</label>
                <input
                  type="text"
                  value={form.nameMyanmar}
                  onChange={(e) => update("nameMyanmar", e.target.value)}
                  required
                  placeholder="ဦးကျော်ကျော်"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              {/* NRC's 4 inline sub-fields need extra width, so it
                  spans the first 2 of 3 columns. Place of Birth fills
                  the third. On tablet (2-col) NRC spans both columns
                  and PoB drops to the next row. */}
              <div className="sm:col-span-2">
                <PublicNrcField
                  value={form.nrcNumber}
                  onChange={(v) => update("nrcNumber", v)}
                />
              </div>
              <div>
                <PlaceOfBirthTypeAhead
                  value={form.placeOfBirth}
                  onChange={(v) => update("placeOfBirth", v)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───── Contact ───── */}
        <section>
          <h2 className={sectionTitle}>Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <div className={iconInputWrap}>
                <div className={iconInside}>
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value)}
                  placeholder="+95 9 123 456 789"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <div className={iconInputWrap}>
                <div className={iconInside}>
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                {/* Email is read-only — it's the verified account
                    address from signup; HR can't have it diverge from
                    the User record. Same treatment student form uses. */}
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  placeholder="you@example.com"
                  title="Email comes from your account and can't be changed here"
                  className={`${inputClass} pl-9 bg-gray-50 text-gray-700 cursor-not-allowed`}
                />
              </div>
            </div>
            {/* Address fills the remaining slot at 3-col, full width
                at 2-col, full width at 1-col. textarea height
                roughly matches two adjacent inputs stacked. */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass}>Current Address</label>
              <textarea
                value={form.currentAddress}
                onChange={(e) => update("currentAddress", e.target.value)}
                rows={2}
                placeholder="House no, street, ward, township"
                className={`${inputClass} h-auto py-2`}
              />
            </div>
          </div>
        </section>

        {/* ───── Current Position ───── */}
        <section>
          <h2 className={sectionTitle}>Current Position</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Appointment Type *</label>
              <div className={iconInputWrap}>
                <div className={iconInside}>
                  <Briefcase className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={form.appointmentTypeId}
                  onChange={(e) => {
                    update("appointmentTypeId", e.target.value);
                    update("primaryAppointmentId", "");
                  }}
                  className={`${inputClass} pl-9`}
                  required
                >
                  <option value="">
                    {loadingTypes ? "Loading…" : "Select type"}
                  </option>
                  {appointmentTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {typeof t.name === "object"
                        ? t.name.en || t.name.mm || t.code
                        : t.name || t.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Position *</label>
              <select
                value={form.primaryAppointmentId}
                onChange={(e) => update("primaryAppointmentId", e.target.value)}
                disabled={!form.appointmentTypeId || loadingAppointments}
                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-400`}
                required
              >
                <option value="">
                  {!form.appointmentTypeId
                    ? "Pick a type first"
                    : loadingAppointments
                      ? "Loading…"
                      : appointments.length === 0
                        ? "No positions available"
                        : "Select position"}
                </option>
                {appointments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {typeof a.name === "object"
                      ? a.name.en || a.name.mm || a.code
                      : a.name || a.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Department Type</label>
              <select
                value={form.departmentTypeFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  update("departmentTypeFilter", v);
                  // Clear the picked department if it no longer matches
                  // the new filter — prevents the dropdown showing a
                  // selected value that isn't in the visible list.
                  if (v && form.primaryDepartmentId) {
                    const picked = (departments as any[]).find(
                      (d) => d._id === form.primaryDepartmentId,
                    );
                    if (picked && picked.type && picked.type !== v) {
                      update("primaryDepartmentId", "");
                    }
                  }
                }}
                className={inputClass}
              >
                <option value="">All departments</option>
                <option value="teaching">Academic / Teaching</option>
                <option value="admin">Administrative</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <div className={iconInputWrap}>
                <div className={iconInside}>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={form.primaryDepartmentId}
                  onChange={(e) => update("primaryDepartmentId", e.target.value)}
                  className={`${inputClass} pl-9`}
                >
                  <option value="">Select department</option>
                  {(departments as any[])
                    .filter(
                      (d) =>
                        !form.departmentTypeFilter ||
                        d.type === form.departmentTypeFilter,
                    )
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.displayName?.en ||
                          d.displayName?.mm ||
                          d.fullName ||
                          d.code}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Position Start Date *</label>
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => update("appointmentDate", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Govt Service Start Date</label>
              <input
                type="date"
                value={form.firstJoinDate}
                onChange={(e) => update("firstJoinDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ───── Submit ───── */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-medium text-white transition-all hover:opacity-95 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primary }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isUpdate ? "Saving…" : "Submitting…"}
              </>
            ) : isUpdate ? (
              "Save changes"
            ) : (
              "Submit Mini Profile"
            )}
          </button>
          <p className="text-[11px] text-center text-gray-400 mt-3">
            {isUpdate
              ? "Saved changes are visible to HR immediately."
              : "After submission, your record waits for HR approval."}
          </p>
        </div>
      </form>

      {/* Mini → Full handoff. Whatever the user has typed gets passed
          up so the Full wizard's first step opens already populated. */}
      {onSwitchToFull && (
        <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
          <span>Need to add family, education, addresses?</span>
          <button
            type="button"
            onClick={() => onSwitchToFull(buildCurrentValues())}
            className="ml-2 inline-flex items-center gap-1 font-medium hover:underline"
            style={{ color: primary }}
          >
            Switch to full profile
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
