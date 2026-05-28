"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  Briefcase,
  Calendar,
  Plus,
} from "lucide-react";
import { listStaff, approveStaff, rejectStaff } from "../actions";

interface Props {
  module: any;
  user: any;
  appId: string;
}

type Status = "pending" | "approved" | "rejected" | "all";

const TABS: Array<{ key: Status; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

/**
 * Approval-queue dashboard for HR staff. The main job is processing
 * `registrationStatus: 'pending'` applicants — approve to admit them
 * into the directory, reject (with a reason) to push them back.
 *
 * Each tab triggers its own list fetch with `?registrationStatus=...`.
 * Pagination is server-side via the standard `{ data, meta }` envelope.
 */
export function StaffApprovalQueue({ module, user, appId }: Props) {
  const [status, setStatus] = useState<Status>("pending");
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    setError(null);
    const r = await listStaff({
      registrationStatus: status === "all" ? undefined : status,
      page,
      limit: 20,
      search: search || undefined,
    });
    if (r.success) {
      setRows(r.data as any);
      setMeta(r.meta || {});
    } else {
      setError(r.error || "Failed to load staff records");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, search]);

  const handleApprove = async (id: string) => {
    setActioning(id);
    const r = await approveStaff(id);
    setActioning(null);
    if (!r.success) {
      setError(r.error || "Approval failed");
      return;
    }
    startTransition(load);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setError("Please give a reason for rejection.");
      return;
    }
    setActioning(rejectTarget._id);
    const r = await rejectStaff(rejectTarget._id, reason);
    setActioning(null);
    if (!r.success) {
      setError(r.error || "Rejection failed");
      return;
    }
    setRejectTarget(null);
    setRejectReason("");
    startTransition(load);
  };

  const isEmpty = !loading && rows.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review applicants and manage the staff directory.
            </p>
          </div>
          <Link
            href={`/${appId}/staffs/new`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New staff
          </Link>
        </div>
      </header>

      {/* Tabs + search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5">
        <div className="border-b border-gray-100 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.key === status;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setStatus(t.key);
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium rounded-md whitespace-nowrap transition-colors"
                  style={
                    active
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #2460B9) 12%, transparent)",
                          color: "var(--color-primary, #2460B9)",
                        }
                      : { color: "#374151" }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
          <form
            className="relative max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchDraft);
              setPage(1);
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Search name, NRC, email..."
              className="block w-full h-9 pl-9 pr-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[var(--color-primary,#2460B9)] focus:ring-1 focus:ring-[var(--color-primary,#2460B9)]"
            />
          </form>
        </div>

        {error && (
          <div className="m-4 rounded-md bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
            Loading…
          </div>
        )}

        {!loading && isEmpty && (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              {status === "pending"
                ? "No pending applications. Great — inbox zero."
                : "No staff records match this filter."}
            </p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {rows.map((s) => (
              <StaffCard
                key={s._id}
                staff={s}
                appId={appId}
                actioning={actioning === s._id}
                onApprove={() => handleApprove(s._id)}
                onReject={() => {
                  setRejectTarget(s);
                  setRejectReason("");
                }}
              />
            ))}
          </ul>
        )}

        {/* Pagination */}
        {!loading && (meta.totalPages || 0) > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {meta.totalPages} · {meta.total} total
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= (meta.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Reject application
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              The applicant will see this reason on their profile page.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. NRC mismatches the photo provided. Please update and resubmit."
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[var(--color-primary,#2460B9)] focus:ring-1 focus:ring-[var(--color-primary,#2460B9)] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="h-9 px-3 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actioning === rejectTarget._id}
                className="h-9 px-3 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actioning === rejectTarget._id ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rejecting…
                  </span>
                ) : (
                  "Confirm reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────── Card ─────────────────────

function StaffCard({
  staff,
  appId,
  actioning,
  onApprove,
  onReject,
}: {
  staff: any;
  appId: string;
  actioning: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const initials = (staff.nameEnglish || staff.nameMyanmar || "?")
    .split(/\s+/)
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const badge = (() => {
    switch (staff.registrationStatus) {
      case "approved":
        return {
          label: "Approved",
          icon: Check,
          className: "bg-green-50 text-green-700 border-green-200",
        };
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "rejected":
        return {
          label: "Rejected",
          icon: AlertCircle,
          className: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          label: staff.registrationStatus || "Unknown",
          icon: AlertCircle,
          className: "bg-gray-50 text-gray-700 border-gray-200",
        };
    }
  })();
  const BadgeIcon = badge.icon;

  const positionLabel = (() => {
    const a = staff.primaryAppointmentId;
    if (!a) return null;
    if (typeof a === "string") return null;
    return a.name?.en || a.name?.mm || a.code || null;
  })();

  const deptLabel = (() => {
    const d = staff.primaryDepartmentId;
    if (!d) return null;
    if (typeof d === "string") return null;
    return d.displayName?.en || d.displayName?.mm || d.fullName || d.shortName || null;
  })();

  const apptDate = staff.appointmentDate
    ? new Date(staff.appointmentDate).toLocaleDateString()
    : null;

  return (
    <li className="px-4 sm:px-5 py-4 hover:bg-gray-50/60 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {staff.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staff.profilePhoto}
              alt={staff.nameEnglish || ""}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--color-primary, #2460B9)" }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${appId}/staffs/${staff._id}/view`}
              className="text-sm font-semibold text-gray-900 hover:underline truncate"
            >
              {staff.nameEnglish || staff.nameMyanmar || "Unnamed"}
            </Link>
            {staff.nameMyanmar && staff.nameEnglish && (
              <span className="text-xs text-gray-500 truncate">
                {staff.nameMyanmar}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
            >
              <BadgeIcon className="w-3 h-3" />
              {badge.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {positionLabel && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {positionLabel}
              </span>
            )}
            {deptLabel && <span>{deptLabel}</span>}
            {apptDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {apptDate}
              </span>
            )}
            {staff.nrcNumber && <span>NRC {staff.nrcNumber}</span>}
            {staff.email && <span>{staff.email}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {staff.registrationStatus === "pending" && (
            <>
              <button
                type="button"
                onClick={onApprove}
                disabled={actioning}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actioning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={actioning}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
          <Link
            href={`/${appId}/staffs/${staff._id}/view`}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-md text-xs font-medium border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </li>
  );
}
