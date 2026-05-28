import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getAuthenticationStatus } from "@repo/auth/server";
import {
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Pencil,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  User,
  Heart,
  Droplet,
  MapPin,
  Users,
  GraduationCap,
  FileText,
  Globe,
  Building2,
  ScrollText,
} from "lucide-react";
import { AccessDenied } from "../components/AccessDenied";
import {
  getMyStaffProfile,
  getMyStaffCompletion,
} from "@/app/(register)/profileSetup/staff/staff-actions";

export const metadata: Metadata = {
  title: "Staff Profile",
  description: "View your staff registration profile and completion status",
};

function getRoleName(role: any): string {
  if (typeof role === "string") return role.toLowerCase();
  if (role && typeof role === "object" && role.Role) return role.Role.toLowerCase();
  return "";
}
function hasRole(user: any, requiredRole: string): boolean {
  if (!user?.roles || !Array.isArray(user.roles)) return false;
  return user.roles.some(
    (role: any) => getRoleName(role) === requiredRole.toLowerCase(),
  );
}
function getPrimaryRole(user: any): string {
  if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0)
    return "unknown";
  return getRoleName(user.roles[0]) || "unknown";
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return { label: "Approved", icon: Check, className: "bg-green-50 text-green-700 border-green-200" };
    case "pending":
      return { label: "Pending HR approval", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "rejected":
      return { label: "Rejected", icon: AlertCircle, className: "bg-red-50 text-red-700 border-red-200" };
    case "incomplete":
      return { label: "Incomplete", icon: AlertCircle, className: "bg-gray-50 text-gray-700 border-gray-200" };
    default:
      return { label: status || "Unknown", icon: AlertCircle, className: "bg-gray-50 text-gray-700 border-gray-200" };
  }
}

export default async function StaffProfilePage() {
  const authStatus = await getAuthenticationStatus();
  if (!authStatus.isAuthenticated || !authStatus.user) {
    redirect("/login?callbackUrl=/profile/staff");
  }
  const user = authStatus.user;

  const isStaff = hasRole(user, "staff");
  const isGuest = hasRole(user, "guest");
  if (!isStaff && !isGuest) {
    return <AccessDenied requiredRole="staff" currentRole={getPrimaryRole(user)} />;
  }

  // Fetch staff record + completion in parallel
  const [profileResult, completionResult] = await Promise.all([
    getMyStaffProfile(),
    getMyStaffCompletion(),
  ]);

  const profile = profileResult.success ? (profileResult.data as any) : null;
  const completion = completionResult.success
    ? (completionResult.data as any)
    : { percentage: 0, filledCount: 0, totalCount: 0 };

  if (!profile) {
    // Guest with no profile → send them to setup. Approved staff with
    // no record is unusual but shouldn't happen in practice; fall through
    // to the same redirect so they don't see an empty page.
    redirect("/profileSetup/staff");
  }

  const badge = statusBadge(profile.registrationStatus);
  const BadgeIcon = badge.icon;
  const pct = Math.max(0, Math.min(100, Number(completion.percentage) || 0));
  const isFullyComplete = pct >= 100;

  const primary = "var(--color-primary, #2460B9)";
  const primarySoft =
    "color-mix(in srgb, var(--color-primary, #2460B9) 12%, transparent)";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header card with avatar + name + status */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ backgroundColor: primary }}
          >
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {profile.nameEnglish || profile.nameMyanmar || user.name}
            </h1>
            {profile.nameMyanmar && profile.nameEnglish && (
              <p className="text-sm text-gray-500 truncate">
                {profile.nameMyanmar}
              </p>
            )}
            <span
              className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
            >
              <BadgeIcon className="w-3 h-3" />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Profile completion
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: primary }}
            >
              {pct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: primary,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {completion.filledCount} of {completion.totalCount} tracked fields
            filled
          </p>
        </div>

        {/* CTA — only when not 100% */}
        {!isFullyComplete && (
          <Link
            href="/profileSetup/staff"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-95 hover:shadow-md group"
            style={{ backgroundColor: primary }}
          >
            <Pencil className="w-4 h-4" />
            Complete full profile
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* ───────── Personal background ───────── */}
      <SectionCard title="Personal" icon={User}>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={Calendar} label="Date of birth" value={formatDate(profile.dateOfBirth)} />
          <InfoRow icon={MapPin} label="Place of birth" value={profile.placeOfBirth} />
          <InfoRow icon={User} label="Gender" value={profile.gender} />
          <InfoRow icon={Heart} label="Marital status" value={profile.maritalStatus} />
          <InfoRow icon={Briefcase} label="NRC" value={profile.nrcNumber} />
          <InfoRow icon={User} label="Other name" value={profile.otherName} />
          <InfoRow icon={User} label="Nationality" value={profile.nationality} />
          <InfoRow icon={User} label="Religion" value={profile.religion} />
          <InfoRow icon={User} label="Race / Ethnicity" value={profile.race} />
          <InfoRow icon={Droplet} label="Blood type" value={profile.bloodType} />
          <InfoRow icon={User} label="Height" value={profile.height ? `${profile.height} cm` : null} />
          <InfoRow icon={User} label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
        </dl>
      </SectionCard>

      {/* ───────── Contact + Address ───────── */}
      <SectionCard title="Contact & Address" icon={MapPin}>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={Mail} label="Email" value={profile.email || user.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phoneNumber} />
          <InfoRow icon={MapPin} label="Current address" value={profile.currentAddress} fullSpan />
          <InfoRow icon={MapPin} label="Permanent address" value={profile.permanentAddress} fullSpan />
          <InfoRow icon={MapPin} label="State / Region" value={profile.stateRegionName} />
          <InfoRow icon={MapPin} label="District" value={profile.districtName} />
          <InfoRow icon={MapPin} label="Township" value={profile.townshipName} />
          <InfoRow icon={MapPin} label="Town" value={profile.townName} />
          <InfoRow icon={MapPin} label="Ward / Village" value={profile.wardVillageName} fullSpan />
        </dl>
      </SectionCard>

      {/* ───────── Family ───────── */}
      <SectionCard title="Family" icon={Users}>
        <div className="space-y-5">
          <PersonBlock label="Father" person={profile.father} />
          <div className="border-t border-gray-100" />
          <PersonBlock label="Mother" person={profile.mother} />
          <div className="border-t border-gray-100" />
          <EmergencyBlock emergency={profile.emergencyContact} />
        </div>
      </SectionCard>

      {/* ───────── Employment ───────── */}
      <SectionCard title="Employment" icon={Briefcase}>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow
            icon={Briefcase}
            label="Position"
            value={resolveName(profile.primaryAppointmentId)}
          />
          <InfoRow
            icon={Building2}
            label="Department"
            value={resolveDeptName(profile.primaryDepartmentId)}
          />
          <InfoRow icon={Calendar} label="Position start date" value={formatDate(profile.appointmentDate)} />
          <InfoRow icon={Calendar} label="Service start date" value={formatDate(profile.firstJoinDate)} />
          <InfoRow icon={ScrollText} label="Gov order number" value={profile.appointmentOrderNumber} />
          <InfoRow icon={Calendar} label="Gov order date" value={formatDate(profile.appointmentOrderDate)} />
          <InfoRow
            icon={Briefcase}
            label="Employment status"
            value={profile.employmentStatus}
          />
          <InfoRow
            icon={Calendar}
            label="Total service years"
            value={profile.totalServiceYears ? `${profile.totalServiceYears} years` : null}
          />
        </dl>
        {Array.isArray(profile.attachedAppointments) &&
          profile.attachedAppointments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Attached appointments
              </h3>
              <ul className="space-y-2">
                {profile.attachedAppointments.map((a: any, i: number) => (
                  <li
                    key={i}
                    className="rounded-md border border-gray-200 p-3 text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {resolveName(a.appointmentId)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {resolveDeptName(a.departmentId)} • {formatDate(a.startDate)}
                      {a.endDate ? ` → ${formatDate(a.endDate)}` : " → current"}
                    </div>
                    {a.orderNumber && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Order: {a.orderNumber}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </SectionCard>

      {/* ───────── Education ───────── */}
      <SectionCard title="Education" icon={GraduationCap}>
        {Array.isArray(profile.educationHistory) &&
        profile.educationHistory.length > 0 ? (
          <ul className="space-y-3">
            {profile.educationHistory.map((e: any, i: number) => (
              <li
                key={i}
                className="rounded-md border border-gray-200 p-3 flex items-start gap-3"
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primarySoft }}
                >
                  <GraduationCap className="w-4 h-4" style={{ color: primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {e.degree || "Unspecified degree"}
                    {e.major ? ` — ${e.major}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {e.institution || "Unspecified institution"}
                    {e.year ? ` • ${e.year}` : ""}
                    {e.grade ? ` • ${e.grade}` : ""}
                  </div>
                  {e.certificateUrl && (
                    <a
                      href={e.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs mt-1 hover:underline"
                      style={{ color: primary }}
                    >
                      <FileText className="w-3 h-3" />
                      Certificate
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint text="No education records yet." />
        )}
      </SectionCard>

      {/* ───────── Public profile ───────── */}
      <SectionCard title="Public profile" icon={Globe}>
        {profile.publicProfile ? (
          <div className="space-y-4">
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow
                icon={Briefcase}
                label="Display title (English)"
                value={profile.publicProfile.displayTitle?.en}
              />
              <InfoRow
                icon={Briefcase}
                label="Display title (Myanmar)"
                value={profile.publicProfile.displayTitle?.mm}
              />
              <InfoRow
                icon={User}
                label="Hierarchy level"
                value={
                  profile.publicProfile.hierarchyLevel
                    ? String(profile.publicProfile.hierarchyLevel)
                    : null
                }
              />
              <InfoRow
                icon={Globe}
                label="Publicly visible"
                value={profile.publicProfile.isPubliclyVisible ? "Yes" : "No"}
              />
            </dl>
            {(profile.publicProfile.bio?.en || profile.publicProfile.bio?.mm) && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {profile.publicProfile.bio?.en && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bio (English)</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {profile.publicProfile.bio.en}
                    </p>
                  </div>
                )}
                {profile.publicProfile.bio?.mm && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bio (Myanmar)</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {profile.publicProfile.bio.mm}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyHint text="No public profile info yet. Add a bio and opt in so colleagues and visitors can find you on the staff directory." />
        )}
      </SectionCard>

      {isFullyComplete && (
        <div
          className="mt-6 rounded-lg border-l-4 p-4 flex items-start gap-3"
          style={{
            backgroundColor: primarySoft,
            borderLeftColor: primary,
          }}
        >
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primary }} />
          <p className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">Profile complete.</span>{" "}
            You've filled in all tracked fields. Edit any time from this page.
          </p>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Helpers ─────────────────────

function formatDate(d: any): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return null;
  }
}

function resolveName(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return null; // raw ObjectId — backend didn't populate
  return v.name?.en || v.name?.mm || v.code || null;
}

function resolveDeptName(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return null;
  return (
    v.displayName?.en ||
    v.displayName?.mm ||
    v.fullName ||
    v.shortName ||
    null
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mt-4">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function PersonBlock({ label, person }: { label: string; person: any }) {
  if (
    !person ||
    (!person.nameEnglish &&
      !person.nameMyanmar &&
      !person.occupation &&
      !person.nrcNumber &&
      !person.phoneNumber)
  ) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          {label}
        </h3>
        <EmptyHint text={`No ${label.toLowerCase()} details provided.`} />
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
        {label}
      </h3>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        <InfoRow icon={User} label="Name (English)" value={person.nameEnglish} />
        <InfoRow icon={User} label="Name (Myanmar)" value={person.nameMyanmar} />
        <InfoRow icon={Briefcase} label="Occupation" value={person.occupation} />
        <InfoRow icon={Briefcase} label="NRC" value={person.nrcNumber} />
        <InfoRow icon={Phone} label="Phone" value={person.phoneNumber} />
      </dl>
    </div>
  );
}

function EmergencyBlock({ emergency }: { emergency: any }) {
  if (
    !emergency ||
    (!emergency.name &&
      !emergency.relationship &&
      !emergency.phoneNumber &&
      !emergency.address)
  ) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Emergency contact
        </h3>
        <EmptyHint text="No emergency contact provided." />
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
        Emergency contact
      </h3>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        <InfoRow icon={User} label="Name" value={emergency.name} />
        <InfoRow icon={Heart} label="Relationship" value={emergency.relationship} />
        <InfoRow icon={Phone} label="Phone" value={emergency.phoneNumber} />
        <InfoRow icon={MapPin} label="Address" value={emergency.address} fullSpan />
      </dl>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="text-xs text-gray-400 italic">{text}</p>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  fullSpan = false,
}: {
  icon: any;
  label: string;
  value: any;
  fullSpan?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${fullSpan ? "sm:col-span-2" : ""}`}>
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm font-medium text-gray-900 break-words">
          {value || <span className="text-gray-400 italic font-normal">Not provided</span>}
        </dd>
      </div>
    </div>
  );
}
