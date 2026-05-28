import { StaffApprovalQueue } from "./components/StaffApprovalQueue";

/**
 * HR-side staff page. Replaces the generic schema-driven list with a
 * focused approval queue: status tabs across the top, card grid below
 * with inline approve / reject actions on each pending applicant.
 *
 * Plain CRUD (create, edit, soft-delete) still falls through to the
 * dynamic `[appId]/[module]/new` and `[id]` routes — we deleted the
 * old `new.tsx` / `detail.tsx` stubs so those routes pick up the
 * schema-driven fallback automatically.
 */
export default function StaffsListPage({ module, user, appId }: any) {
  return <StaffApprovalQueue module={module} user={user} appId={appId} />;
}
