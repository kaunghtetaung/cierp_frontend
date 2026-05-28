"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserCircle,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  GraduationCap,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Globe,
  MapPin,
  ChevronsUpDown,
  History,
  Plane,
} from "lucide-react";
import {
  submitStaffSelfRegistration,
  updateMyStaffProfile,
  listAppointmentTypes,
  listAppointmentsByType,
  listDepartments,
  listPublicOrganizations,
  type StaffSelfRegistrationData,
} from "../staff-actions";
// Same widgets the student form uses — keeps NRC parsing, S3-backed
// photo upload, and the polished UX consistent across the two flows.
import { PublicNrcField } from "../../student/components/PublicNrcField";
import { StudentPhotoUpload } from "../../student/components/StudentPhotoUpload";
// Region cascade actions — power the State → District → Township →
// Town dropdowns just like the student `AddressInfoStep`.
import {
  getStateRegions,
  getDistrictsByState,
  getTownshipsByDistrict,
  getTownsByTownship,
  type RegionData,
} from "@/actions/student-registration";

// Option lists shared with the student form. Keeping them inline
// instead of importing student's `PersonalInfoStep` because that file
// is heavyweight (form context, react-hook-form) and we only need
// the static arrays.
const ETHNICITY_OPTIONS = [
  "Bamar",
  "Shan",
  "Karen",
  "Rakhine",
  "Chin",
  "Mon",
  "Kachin",
  "Kayah",
  "Chinese",
  "Indian",
  "Other",
];
const RELIGION_OPTIONS = [
  "Buddhism",
  "Christianity",
  "Islam",
  "Hinduism",
  "Animism",
  "None",
  "Other",
];
const NATIONALITY_OPTIONS = [
  "Myanmar",
  "Chinese",
  "Indian",
  "Thai",
  "British",
  "American",
  "Japanese",
  "Korean",
  "Singaporean",
  "Malaysian",
  "Vietnamese",
  "Bangladeshi",
  "Other",
];

interface FullStaffWizardProps {
  user: any;
  initialProfile?: any;
  /** When true the wizard sends PATCH /me; otherwise POST /self-register. */
  isUpdate: boolean;
  /** Switch back to the Mini form. Receives the current Full-wizard
   *  state so partially-typed input survives the swap. */
  onSwitchToMini?: (currentValues: any) => void;
}

interface RefOption {
  _id: string;
  name?: { en?: string; mm?: string } | string;
  code?: string;
  fullName?: string;
  displayName?: { en?: string; mm?: string };
}

type StepKey =
  | "personal"
  | "contact"
  | "family"
  | "employment"
  | "history"
  | "travel"
  | "education"
  | "public";

// Career history flows: current position → previous appointments →
// foreign trips → academic / training records → public-facing
// profile. `travel` sits between `history` and `education` because
// many trips are training-adjacent, but HR queries travel
// independently (clearance + audit) so it stays its own step rather
// than being folded into education.
const STEPS: Array<{ key: StepKey; label: string; icon: any }> = [
  { key: "personal", label: "Personal", icon: UserCircle },
  { key: "contact", label: "Contact", icon: MapPin },
  { key: "family", label: "Family", icon: Users },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "history", label: "Previous Appointments", icon: History },
  { key: "travel", label: "Foreign Travel", icon: Plane },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "public", label: "Public profile", icon: Globe },
];

const INPUT =
  "block w-full h-10 px-3 border border-gray-300 rounded-md text-sm transition-colors focus:outline-none focus:border-[var(--color-primary,#2460B9)] focus:ring-1 focus:ring-[var(--color-primary,#2460B9)]";
const LABEL = "block text-xs font-medium text-gray-700 mb-1.5";
const SECTION_TITLE =
  "text-sm font-semibold text-gray-700 uppercase tracking-wider";

/**
 * Full multi-step staff profile wizard. Covers every field in the
 * `Staff` schema that a user can sensibly self-fill; admin/HR-only
 * fields (staffId placeholder, code, slug, registrationStatus) are
 * excluded.
 *
 * State lives in a single `form` object so the Review step can render
 * a flat summary. Submission paths:
 *   - `isUpdate=true`  → PATCH /cpms/staffs/me  (Mini already submitted)
 *   - `isUpdate=false` → POST /cpms/staffs/self-register  (fresh user)
 */
export function FullStaffWizard({
  user,
  initialProfile,
  isUpdate,
  onSwitchToMini,
}: FullStaffWizardProps) {
  const router = useRouter();
  const primary = "var(--color-primary, #2460B9)";
  const primarySoft =
    "color-mix(in srgb, var(--color-primary, #2460B9) 12%, transparent)";

  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dropdown ref data
  const [appointmentTypes, setAppointmentTypes] = useState<RefOption[]>([]);
  const [appointments, setAppointments] = useState<RefOption[]>([]);
  const [departments, setDepartments] = useState<RefOption[]>([]);
  // Cross-tenant org list for the Previous Appointments typeahead.
  // 19 production orgs (18 DHRH/health-sector schools + the dev org)
  // load from `GET /organizations/public-list`.
  const [publicOrgs, setPublicOrgs] = useState<
    Array<{
      _id: string;
      fullName: string;
      shortName?: string;
      displayName?: { en?: string; mm?: string };
    }>
  >([]);

  // Region cascade — State → District → Township → Town. Each level
  // refetches when its parent value changes. Wards stay free text
  // (no API for those today).
  const [stateRegions, setStateRegions] = useState<RegionData[]>([]);
  const [districts, setDistricts] = useState<RegionData[]>([]);
  const [townships, setTownships] = useState<RegionData[]>([]);
  const [towns, setTowns] = useState<RegionData[]>([]);

  // "Same as current address" — when true, permanentAddress is
  // pinned to currentAddress and the field becomes read-only.
  const [sameAsCurrent, setSameAsCurrent] = useState(
    Boolean(
      (initialProfile as any)?.currentAddress &&
        (initialProfile as any)?.currentAddress ===
          (initialProfile as any)?.permanentAddress,
    ),
  );

  const initial = initialProfile || {};
  const initialAppointmentTypeId = useMemo(() => {
    // Mini → Full handoff: when MiniStaffForm forwards its draft it
    // includes the top-level `appointmentTypeId` it had on screen, so
    // the cascading picker's Step 1 stays selected after the swap.
    // For backend-loaded records we instead read it off the populated
    // `primaryAppointmentId.appointmentTypeId`.
    if ((initial as any).appointmentTypeId) return (initial as any).appointmentTypeId;
    const a = initial.primaryAppointmentId;
    return typeof a === "object" && a?.appointmentTypeId
      ? typeof a.appointmentTypeId === "object"
        ? a.appointmentTypeId._id
        : a.appointmentTypeId
      : "";
  }, [initial.primaryAppointmentId, (initial as any).appointmentTypeId]);

  const [form, setForm] = useState({
    // Personal
    nameEnglish: initial.nameEnglish || "",
    nameMyanmar: initial.nameMyanmar || "",
    otherName: initial.otherName || "",
    nrcNumber: initial.nrcNumber || "",
    dateOfBirth: initial.dateOfBirth ? initial.dateOfBirth.slice(0, 10) : "",
    gender: initial.gender || "",
    placeOfBirth: initial.placeOfBirth || "",
    nationality: initial.nationality || "",
    religion: initial.religion || "",
    race: initial.race || "",
    bloodType: initial.bloodType || "",
    maritalStatus: initial.maritalStatus || "",
    height: initial.height ? String(initial.height) : "",
    weight: initial.weight ? String(initial.weight) : "",
    profilePhoto: initial.profilePhoto || "",

    // Contact / Address
    phoneNumber: initial.phoneNumber || "",
    email: initial.email || user?.email || "",
    currentAddress: initial.currentAddress || "",
    permanentAddress: initial.permanentAddress || "",
    stateRegionName: initial.stateRegionName || "",
    districtName: initial.districtName || "",
    townshipName: initial.townshipName || "",
    townName: initial.townName || "",
    wardVillageName: initial.wardVillageName || "",

    // Family — father
    fatherNameEnglish: initial.father?.nameEnglish || "",
    fatherNameMyanmar: initial.father?.nameMyanmar || "",
    fatherOccupation: initial.father?.occupation || "",
    fatherNrc: initial.father?.nrcNumber || "",
    fatherPhone: initial.father?.phoneNumber || "",
    // Mother
    motherNameEnglish: initial.mother?.nameEnglish || "",
    motherNameMyanmar: initial.mother?.nameMyanmar || "",
    motherOccupation: initial.mother?.occupation || "",
    motherNrc: initial.mother?.nrcNumber || "",
    motherPhone: initial.mother?.phoneNumber || "",
    // Emergency
    emergencyName: initial.emergencyContact?.name || "",
    emergencyRelationship: initial.emergencyContact?.relationship || "",
    emergencyPhone: initial.emergencyContact?.phoneNumber || "",
    emergencyAddress: initial.emergencyContact?.address || "",

    // Employment
    appointmentTypeId: initialAppointmentTypeId,
    primaryAppointmentId:
      typeof initial.primaryAppointmentId === "object"
        ? initial.primaryAppointmentId?._id
        : initial.primaryAppointmentId || "",
    primaryDepartmentId:
      typeof initial.primaryDepartmentId === "object"
        ? initial.primaryDepartmentId?._id
        : initial.primaryDepartmentId || "",
    // UI-only filter — narrows the Department dropdown to teaching
    // vs admin entries. Not sent in the payload; reporting derives
    // type from the resolved Department record itself.
    departmentTypeFilter:
      typeof initial.primaryDepartmentId === "object"
        ? (initial.primaryDepartmentId as any)?.type || ""
        : "",
    appointmentDate: initial.appointmentDate
      ? initial.appointmentDate.slice(0, 10)
      : "",
    firstJoinDate: initial.firstJoinDate ? initial.firstJoinDate.slice(0, 10) : "",
    appointmentOrderNumber: initial.appointmentOrderNumber || "",
    appointmentOrderDate: initial.appointmentOrderDate
      ? initial.appointmentOrderDate.slice(0, 10)
      : "",

    // Public profile
    publicDisplayTitleEn: initial.publicProfile?.displayTitle?.en || "",
    publicDisplayTitleMm: initial.publicProfile?.displayTitle?.mm || "",
    publicBioEn: initial.publicProfile?.bio?.en || "",
    publicBioMm: initial.publicProfile?.bio?.mm || "",
    publicPhoto: initial.publicProfile?.publicPhoto || "",
    publicHierarchyLevel: initial.publicProfile?.hierarchyLevel
      ? String(initial.publicProfile.hierarchyLevel)
      : "",
    publicIsVisible: Boolean(initial.publicProfile?.isPubliclyVisible),
  });

  // Education + training history. `type` widens the row beyond just
  // degrees so government staff can list ဖောင်ကြီးသင်တန်း, မွမ်းမံ
  // သင်တန်း, workshops etc. Legacy rows imported from HR with no
  // `type` are seeded as 'degree' since that's what the old form
  // collected.
  const [educationHistory, setEducationHistory] = useState<
    Array<{
      type: string;
      degree: string;
      major: string;
      institution: string;
      year: string;
      startDate: string;
      endDate: string;
      grade: string;
      certificateUrl: string;
    }>
  >(
    initial.educationHistory?.length
      ? initial.educationHistory.map((e: any) => ({
          type: e.type || "degree",
          degree: e.degree || "",
          major: e.major || "",
          institution: e.institution || "",
          year: e.year ? String(e.year) : "",
          startDate: e.startDate ? e.startDate.slice(0, 10) : "",
          endDate: e.endDate ? e.endDate.slice(0, 10) : "",
          grade: e.grade || "",
          certificateUrl: e.certificateUrl || "",
        }))
      : [
          {
            type: "degree",
            degree: "",
            major: "",
            institution: "",
            year: "",
            startDate: "",
            endDate: "",
            grade: "",
            certificateUrl: "",
          },
        ],
  );

  // Foreign Travel — overseas trips. Same blank-row default + filter
  // pattern as Education/Previous Appointments.
  const [foreignTravels, setForeignTravels] = useState<
    Array<{
      country: string;
      purpose: string;
      fromDate: string;
      toDate: string;
      sponsorOrganization: string;
      remark: string;
    }>
  >(
    initial.foreignTravels?.length
      ? initial.foreignTravels.map((t: any) => ({
          country: t.country || "",
          purpose: t.purpose || "",
          fromDate: t.fromDate ? t.fromDate.slice(0, 10) : "",
          toDate: t.toDate ? t.toDate.slice(0, 10) : "",
          sponsorOrganization: t.sponsorOrganization || "",
          remark: t.remark || "",
        }))
      : [
          {
            country: "",
            purpose: "",
            fromDate: "",
            toDate: "",
            sponsorOrganization: "",
            remark: "",
          },
        ],
  );

  // Previous Appointments — career history *before* the current org.
  // Defaults to one empty row so the step has something to show. The
  // backend ignores all-blank rows (filtered in `buildPayload`).
  const [previousAppointments, setPreviousAppointments] = useState<
    Array<{
      organizationId: string;
      organizationName: string;
      departmentName: string;
      ministry: string;
      position: string;
      startDate: string;
      endDate: string;
      wasUnderMOH: boolean;
      reasonForLeaving: string;
    }>
  >(
    initial.previousAppointments?.length
      ? initial.previousAppointments.map((p: any) => ({
          organizationId:
            typeof p.organizationId === "object"
              ? p.organizationId?._id || ""
              : p.organizationId || "",
          organizationName: p.organizationName || "",
          departmentName: p.departmentName || "",
          ministry: p.ministry || "",
          position: p.position || "",
          startDate: p.startDate ? p.startDate.slice(0, 10) : "",
          endDate: p.endDate ? p.endDate.slice(0, 10) : "",
          wasUnderMOH: Boolean(p.wasUnderMOH),
          reasonForLeaving: p.reasonForLeaving || "",
        }))
      : [
          {
            organizationId: "",
            organizationName: "",
            departmentName: "",
            ministry: "",
            position: "",
            startDate: "",
            endDate: "",
            wasUnderMOH: false,
            reasonForLeaving: "",
          },
        ],
  );

  // Mount diagnostic — surfaces what Mini handed off so we can tell
  // "value never arrived" from "value arrived but dropdown can't match
  // it yet". Strip the console.log once the handoff is verified.
  useEffect(() => {
    console.log("[FullStaffWizard] mounted with handoff:", {
      hasInitialProfile: Boolean(initialProfile),
      initialKeys: initialProfile ? Object.keys(initialProfile) : [],
      appointmentTypeId: (initial as any)?.appointmentTypeId,
      primaryAppointmentId: initial?.primaryAppointmentId,
      primaryDepartmentId: initial?.primaryDepartmentId,
      formAppointmentTypeId: form.appointmentTypeId,
      formPrimaryAppointmentId: form.primaryAppointmentId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dropdown data
  useEffect(() => {
    (async () => {
      const t = await listAppointmentTypes();
      if (t.success) {
        setAppointmentTypes(t.data as any);
        console.log(
          "[FullStaffWizard] appointmentTypes loaded:",
          (t.data as any).length,
          "items; current form.appointmentTypeId =",
          form.appointmentTypeId,
          "match =",
          (t.data as any).some((x: any) => x._id === form.appointmentTypeId),
        );
      }
      const d = await listDepartments();
      if (d.success) setDepartments(d.data as any);
      // Cross-tenant org list — for Previous Appointments typeahead.
      const o = await listPublicOrganizations();
      if (o.success) setPublicOrgs(o.data as any);
      // Region cascade — first level loads up front; child levels
      // load when their parent changes (effects below).
      const s = await getStateRegions();
      if (s.success && s.data) setStateRegions(s.data as any);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cascade: District list depends on chosen State/Region.
  useEffect(() => {
    if (!form.stateRegionName) {
      setDistricts([]);
      return;
    }
    (async () => {
      const r = await getDistrictsByState(form.stateRegionName);
      if (r.success && r.data) setDistricts(r.data as any);
    })();
  }, [form.stateRegionName]);

  // Cascade: Township depends on District.
  useEffect(() => {
    if (!form.districtName) {
      setTownships([]);
      return;
    }
    (async () => {
      const r = await getTownshipsByDistrict(form.districtName);
      if (r.success && r.data) setTownships(r.data as any);
    })();
  }, [form.districtName]);

  // Cascade: Town depends on Township.
  useEffect(() => {
    if (!form.townshipName) {
      setTowns([]);
      return;
    }
    (async () => {
      const r = await getTownsByTownship(form.townshipName);
      if (r.success && r.data) setTowns(r.data as any);
    })();
  }, [form.townshipName]);

  // Sync permanentAddress with currentAddress whenever the checkbox is on.
  useEffect(() => {
    if (sameAsCurrent && form.currentAddress !== form.permanentAddress) {
      setForm((f) => ({ ...f, permanentAddress: f.currentAddress }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsCurrent, form.currentAddress]);

  useEffect(() => {
    if (!form.appointmentTypeId) {
      setAppointments([]);
      return;
    }
    (async () => {
      const r = await listAppointmentsByType(form.appointmentTypeId);
      if (r.success) {
        setAppointments(r.data as any);
        if ((r.data as any).length === 1 && !form.primaryAppointmentId) {
          setForm((f) => ({ ...f, primaryAppointmentId: (r.data as any)[0]._id }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.appointmentTypeId]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addEducation = () =>
    setEducationHistory((rows) => [
      ...rows,
      {
        type: "degree",
        degree: "",
        major: "",
        institution: "",
        year: "",
        startDate: "",
        endDate: "",
        grade: "",
        certificateUrl: "",
      },
    ]);
  const removeEducation = (i: number) =>
    setEducationHistory((rows) => rows.filter((_, idx) => idx !== i));
  const setEducationField = (i: number, key: keyof (typeof educationHistory)[0], v: string) =>
    setEducationHistory((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));

  const addForeignTravel = () =>
    setForeignTravels((rows) => [
      ...rows,
      {
        country: "",
        purpose: "",
        fromDate: "",
        toDate: "",
        sponsorOrganization: "",
        remark: "",
      },
    ]);
  const removeForeignTravel = (i: number) =>
    setForeignTravels((rows) => rows.filter((_, idx) => idx !== i));
  const setForeignTravelField = <K extends keyof (typeof foreignTravels)[0]>(
    i: number,
    key: K,
    v: (typeof foreignTravels)[0][K],
  ) =>
    setForeignTravels((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)),
    );

  const addPreviousAppointment = () =>
    setPreviousAppointments((rows) => [
      ...rows,
      {
        organizationId: "",
        organizationName: "",
        departmentName: "",
        ministry: "",
        position: "",
        startDate: "",
        endDate: "",
        wasUnderMOH: false,
        reasonForLeaving: "",
      },
    ]);
  const removePreviousAppointment = (i: number) =>
    setPreviousAppointments((rows) => rows.filter((_, idx) => idx !== i));
  const setPreviousAppointmentField = <
    K extends keyof (typeof previousAppointments)[0],
  >(
    i: number,
    key: K,
    v: (typeof previousAppointments)[0][K],
  ) =>
    setPreviousAppointments((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)),
    );

  // Validation per step. Keep light — backend is the source of truth.
  const validateStep = (idx: number): string | null => {
    if (idx === 0) {
      if (!form.nameEnglish.trim()) return "Name (English) is required.";
      if (!form.nameMyanmar.trim()) return "Name (Myanmar) is required.";
      if (!form.nrcNumber.trim()) return "NRC is required.";
      if (!form.dateOfBirth) return "Date of birth is required.";
    }
    if (idx === 3) {
      if (!form.primaryAppointmentId)
        return "Please pick your appointment type and position.";
      if (!form.appointmentDate)
        return "Current appointment start date is required.";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(stepIdx);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const goPrev = () => {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  const buildPayload = (): StaffSelfRegistrationData => ({
    nameEnglish: form.nameEnglish.trim(),
    nameMyanmar: form.nameMyanmar.trim(),
    nrcNumber: form.nrcNumber.trim(),
    dateOfBirth: form.dateOfBirth,
    phoneNumber: form.phoneNumber || undefined,
    email: form.email || undefined,
    currentAddress: form.currentAddress || undefined,
    permanentAddress: form.permanentAddress || undefined,
    placeOfBirth: form.placeOfBirth || undefined,
    stateRegionName: form.stateRegionName || undefined,
    districtName: form.districtName || undefined,
    townshipName: form.townshipName || undefined,
    townName: form.townName || undefined,
    wardVillageName: form.wardVillageName || undefined,

    gender: form.gender || undefined,
    nationality: form.nationality || undefined,
    religion: form.religion || undefined,
    race: form.race || undefined,
    bloodType: form.bloodType || undefined,
    maritalStatus: form.maritalStatus || undefined,
    height: form.height ? Number(form.height) : undefined,
    weight: form.weight ? Number(form.weight) : undefined,
    profilePhoto: form.profilePhoto || undefined,

    father:
      form.fatherNameEnglish ||
      form.fatherNameMyanmar ||
      form.fatherOccupation ||
      form.fatherNrc ||
      form.fatherPhone
        ? {
            nameEnglish: form.fatherNameEnglish || undefined,
            nameMyanmar: form.fatherNameMyanmar || undefined,
            // Mini schema only typed names — but the DTO accepts the
            // expanded ParentInfo shape, so include the extras here.
            ...(form.fatherOccupation || form.fatherNrc || form.fatherPhone
              ? ({
                  occupation: form.fatherOccupation || undefined,
                  nrcNumber: form.fatherNrc || undefined,
                  phoneNumber: form.fatherPhone || undefined,
                } as any)
              : {}),
          }
        : undefined,
    mother:
      form.motherNameEnglish ||
      form.motherNameMyanmar ||
      form.motherOccupation ||
      form.motherNrc ||
      form.motherPhone
        ? {
            nameEnglish: form.motherNameEnglish || undefined,
            nameMyanmar: form.motherNameMyanmar || undefined,
            occupation: form.motherOccupation || undefined,
            nrcNumber: form.motherNrc || undefined,
            phoneNumber: form.motherPhone || undefined,
          }
        : undefined,
    emergencyContact:
      form.emergencyName ||
      form.emergencyRelationship ||
      form.emergencyPhone ||
      form.emergencyAddress
        ? {
            name: form.emergencyName || undefined,
            relationship: form.emergencyRelationship || undefined,
            phoneNumber: form.emergencyPhone || undefined,
            address: form.emergencyAddress || undefined,
          }
        : undefined,

    primaryAppointmentId: form.primaryAppointmentId || undefined,
    primaryDepartmentId: form.primaryDepartmentId || undefined,
    appointmentDate: form.appointmentDate || undefined,
    firstJoinDate: form.firstJoinDate || undefined,

    educationHistory: educationHistory
      .filter(
        (e) =>
          e.degree ||
          e.major ||
          e.institution ||
          e.year ||
          e.startDate ||
          e.endDate ||
          e.grade ||
          e.certificateUrl,
      )
      .map((e) => ({
        type: e.type || undefined,
        degree: e.degree || undefined,
        major: e.major || undefined,
        institution: e.institution || undefined,
        year: e.year ? Number(e.year) : undefined,
        startDate: e.startDate || undefined,
        endDate: e.endDate || undefined,
        grade: e.grade || undefined,
        certificateUrl: e.certificateUrl || undefined,
      })),

    foreignTravels: foreignTravels
      .filter(
        (t) =>
          t.country ||
          t.purpose ||
          t.fromDate ||
          t.toDate ||
          t.sponsorOrganization ||
          t.remark,
      )
      .map((t) => ({
        country: t.country || undefined,
        purpose: t.purpose || undefined,
        fromDate: t.fromDate || undefined,
        toDate: t.toDate || undefined,
        sponsorOrganization: t.sponsorOrganization || undefined,
        remark: t.remark || undefined,
      })),

    // Drop entirely-blank rows; backend treats missing array as
    // "no previous appointments" rather than an explicit empty list.
    previousAppointments: previousAppointments
      .filter(
        (p) =>
          p.organizationId ||
          p.organizationName ||
          p.departmentName ||
          p.ministry ||
          p.position ||
          p.startDate ||
          p.endDate,
      )
      .map((p) => ({
        organizationId: p.organizationId || undefined,
        organizationName: p.organizationName || undefined,
        departmentName: p.departmentName || undefined,
        ministry: p.ministry || undefined,
        position: p.position || undefined,
        startDate: p.startDate || undefined,
        endDate: p.endDate || undefined,
        wasUnderMOH: p.wasUnderMOH,
        reasonForLeaving: p.reasonForLeaving || undefined,
      })),

    publicProfile:
      form.publicBioEn ||
      form.publicBioMm ||
      form.publicDisplayTitleEn ||
      form.publicDisplayTitleMm ||
      form.publicPhoto ||
      form.publicHierarchyLevel ||
      form.publicIsVisible
        ? ({
            bio: form.publicBioEn || form.publicBioMm
              ? {
                  en: form.publicBioEn || undefined,
                  mm: form.publicBioMm || undefined,
                }
              : undefined,
            displayTitle:
              form.publicDisplayTitleEn || form.publicDisplayTitleMm
                ? {
                    en: form.publicDisplayTitleEn || undefined,
                    mm: form.publicDisplayTitleMm || undefined,
                  }
                : undefined,
            publicPhoto: form.publicPhoto || undefined,
            hierarchyLevel: form.publicHierarchyLevel
              ? Number(form.publicHierarchyLevel)
              : undefined,
            isPubliclyVisible: form.publicIsVisible,
          } as any)
        : undefined,
  });

  const handleSubmit = async () => {
    for (let i = 0; i <= STEPS.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        setStepIdx(i);
        setError(err);
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    const payload = buildPayload();
    const result = isUpdate
      ? await updateMyStaffProfile(payload, initialProfile?._id)
      : await submitStaffSelfRegistration(payload);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Submission failed.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/profile/staff"), 1200);
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
            Redirecting to your staff profile…
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: primary }} />
        </div>
      </div>
    );
  }

  const step = STEPS[stepIdx];
  const StepIcon = step.icon;
  const isLast = stepIdx === STEPS.length - 1;

  // Full → Mini handoff: pass the current wizard values back so the
  // Mini form's `initialProfile` prop re-hydrates after the swap.
  const buildCurrentValues = () => buildPayload();

  // Completion percentage drives both the mobile progress bar and the
  // desktop connector fills. `stepIdx` is the *current* step; anything
  // before it is "done". The trailing-edge division is intentional —
  // the user is "into" step N, not yet done with it.
  const completionPct = Math.round((stepIdx / (STEPS.length - 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {onSwitchToMini && (
        <button
          type="button"
          onClick={() => onSwitchToMini(buildCurrentValues())}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Switch back to mini form
        </button>
      )}

      {/* ─── Desktop step ribbon ────────────────────────────────────
          8 steps fit horizontally inside max-w-5xl with room for the
          longer labels ("Previous Appointments"). The connector line
          between circles fills with the brand color once the user has
          passed it — clearer than the old uniform gray line. */}
      <ol className="hidden sm:flex items-stretch mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === stepIdx;
          const done = i < stepIdx;
          const isFirst = i === 0;
          return (
            <li key={s.key} className="flex-1 flex flex-col items-center min-w-0 relative">
              {/* Connector segment to the previous step. Lives inside
                  the *current* li so labels stay aligned with their
                  circle; the first step has no preceding segment.
                  `calc(±50% + 24px)` carves a 24-px gutter on either
                  end so the line stops at the previous circle's right
                  edge and resumes at the current circle's left edge
                  — instead of cutting straight through the icons. */}
              {!isFirst && (
                <div
                  className="absolute top-[19px] right-[calc(50%+24px)] left-[calc(-50%+24px)] h-0.5 transition-colors"
                  style={{
                    backgroundColor: done || active ? primary : "#E5E7EB",
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => setStepIdx(i)}
                className="relative flex flex-col items-center text-center px-1 group focus:outline-none"
                disabled={i > stepIdx}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ring-4 ring-white"
                  style={
                    active
                      ? {
                          backgroundColor: primary,
                          color: "#FFFFFF",
                          boxShadow:
                            "0 0 0 4px color-mix(in srgb, var(--color-primary, #2460B9) 18%, transparent)",
                        }
                      : done
                        ? { backgroundColor: primary, color: "#FFFFFF" }
                        : {
                            backgroundColor: "#FFFFFF",
                            border: "1.5px solid #E5E7EB",
                            color: "#9CA3AF",
                          }
                  }
                >
                  {done ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`text-[11px] leading-tight ${
                    active
                      ? "font-semibold text-gray-900"
                      : done
                        ? "font-medium text-gray-600"
                        : "text-gray-400"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                  {i + 1} / {STEPS.length}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ─── Mobile step indicator ──────────────────────────────────
          Compact header + thin progress bar. The icon + label combo
          gives the user enough orientation without competing with the
          form for vertical real-estate. */}
      <div className="sm:hidden mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primary, color: "#FFFFFF" }}
            >
              <StepIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 leading-none">
                Step {stepIdx + 1} of {STEPS.length}
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight mt-0.5">
                {step.label}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: primary }}
          >
            {completionPct}%
          </span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${completionPct}%`,
              backgroundColor: primary,
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: primarySoft }}
          >
            <StepIcon className="w-5 h-5" style={{ color: primary }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{step.label}</h2>
            <p className="text-xs text-gray-500">
              Step {stepIdx + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* ───────── Step content ───────── */}
        {step.key === "personal" && (
          <div className="space-y-5">
            <Section title="Identity">
              {/* Photo on the left, name fields stacked on the right —
                  same avatar-card layout the Mini form uses. `items-start`
                  keeps both columns top-anchored against the upload
                  widget's taller box. */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-3">
                <div className="flex-shrink-0 mx-auto sm:mx-0">
                  <StudentPhotoUpload
                    value={form.profilePhoto}
                    onChange={(v) => update("profilePhoto", v)}
                    tenantId={user?.tenantId || ""}
                    appId="publicWeb"
                    size="sm"
                  />
                </div>
                <div className="flex-1 grid gap-3 sm:pt-1">
                  <Field label="Full Name (English) *">
                    <input
                      type="text"
                      value={form.nameEnglish}
                      onChange={(e) => update("nameEnglish", e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Full Name (Myanmar) *">
                    <input
                      type="text"
                      value={form.nameMyanmar}
                      onChange={(e) => update("nameMyanmar", e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Date of Birth *">
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => update("dateOfBirth", e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                </div>
              </div>

              <Row>
                <div className="sm:col-span-2">
                  {/* PublicNrcField renders its own "NRC Number" label
                      so we don't wrap it in <Field>. Myanmar-aware
                      state→township→type→serial picker. */}
                  <PublicNrcField
                    value={form.nrcNumber}
                    onChange={(v) => update("nrcNumber", v)}
                  />
                </div>
                <Field label="Other Name / Aliases">
                  <input
                    type="text"
                    value={form.otherName}
                    onChange={(e) => update("otherName", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Place of Birth">
                  <input
                    type="text"
                    value={form.placeOfBirth}
                    onChange={(e) => update("placeOfBirth", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Marital Status">
                  <select
                    value={form.maritalStatus}
                    onChange={(e) => update("maritalStatus", e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </Field>
              </Row>
            </Section>
            <Section title="Background">
              <Row>
                <Field label="Nationality">
                  <SearchableCombobox
                    value={form.nationality}
                    onChange={(v) => update("nationality", v)}
                    options={NATIONALITY_OPTIONS}
                    placeholder="Select nationality"
                  />
                </Field>
                <Field label="Religion">
                  <SearchableCombobox
                    value={form.religion}
                    onChange={(v) => update("religion", v)}
                    options={RELIGION_OPTIONS}
                    placeholder="Select religion"
                  />
                </Field>
                <Field label="Race / Ethnicity (လူမျိုး)">
                  <SearchableCombobox
                    value={form.race}
                    onChange={(v) => update("race", v)}
                    options={ETHNICITY_OPTIONS}
                    placeholder="Select race"
                  />
                </Field>
                <Field label="Blood Type">
                  <select
                    value={form.bloodType}
                    onChange={(e) => update("bloodType", e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Height (cm)">
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => update("height", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Weight (kg)">
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => update("weight", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
            </Section>
          </div>
        )}

        {step.key === "contact" && (
          <div className="space-y-5">
            <Section title="Contact">
              <Row>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => update("phoneNumber", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    readOnly
                    title="Email comes from your account and can't be changed here"
                    className={`${INPUT} bg-gray-50 text-gray-700 cursor-not-allowed`}
                  />
                </Field>
              </Row>
            </Section>

            <Section title="Addresses">
              <Field label="Current Address">
                <textarea
                  rows={2}
                  value={form.currentAddress}
                  onChange={(e) => update("currentAddress", e.target.value)}
                  className={`${INPUT} h-auto py-2`}
                />
              </Field>

              {/* "Same as current" checkbox — mirrors student form
                  AddressInfoStep. When checked, the permanent textarea
                  becomes read-only and stays in sync with the current
                  address via a useEffect above. */}
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsCurrent}
                  onChange={(e) => setSameAsCurrent(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: "var(--color-primary, #2460B9)" }}
                />
                <span className="text-xs text-gray-700">
                  Permanent address is the same as current address
                </span>
              </label>

              <Field label="Permanent Address">
                <textarea
                  rows={2}
                  value={form.permanentAddress}
                  onChange={(e) => update("permanentAddress", e.target.value)}
                  readOnly={sameAsCurrent}
                  className={`${INPUT} h-auto py-2 ${
                    sameAsCurrent ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
                />
              </Field>
            </Section>

            <Section title="Region (cascading)">
              <Row>
                {/* Region rows — the backend `/regions/ref` endpoint
                    returns rows shaped `{name, pcode}` per level (NOT
                    the `{stateRegion, district, …}` shape the
                    RegionData type advertises). Using `.name`/`.pcode`
                    matches the student form's actual access pattern. */}
                <Field label="State / Region (တိုင်း / ပြည်နယ်)">
                  <select
                    value={form.stateRegionName}
                    onChange={(e) => {
                      // Clear downstream selections on parent change
                      update("stateRegionName", e.target.value);
                      update("districtName", "");
                      update("townshipName", "");
                      update("townName", "");
                    }}
                    className={INPUT}
                  >
                    <option value="">Select state / region</option>
                    {stateRegions.map((s: any, i) => (
                      <option key={`${s.pcode}-${i}`} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="District (ခရိုင်)">
                  <select
                    value={form.districtName}
                    onChange={(e) => {
                      update("districtName", e.target.value);
                      update("townshipName", "");
                      update("townName", "");
                    }}
                    disabled={!form.stateRegionName}
                    className={`${INPUT} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">
                      {form.stateRegionName ? "Select district" : "Pick state first"}
                    </option>
                    {districts.map((d: any, i) => (
                      <option key={`${d.pcode}-${i}`} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Township (မြို့နယ်)">
                  <select
                    value={form.townshipName}
                    onChange={(e) => {
                      update("townshipName", e.target.value);
                      update("townName", "");
                    }}
                    disabled={!form.districtName}
                    className={`${INPUT} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">
                      {form.districtName ? "Select township" : "Pick district first"}
                    </option>
                    {townships.map((t: any, i) => (
                      <option key={`${t.pcode}-${i}`} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Town (မြို့)">
                  <select
                    value={form.townName}
                    onChange={(e) => update("townName", e.target.value)}
                    disabled={!form.townshipName}
                    className={`${INPUT} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">
                      {form.townshipName ? "Select town" : "Pick township first"}
                    </option>
                    {towns.map((t: any, i) => (
                      <option key={`${t.pcode}-${i}`} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
                {/* Ward stays free text — no API for that level. */}
                <Field label="Ward / Village (ရပ်ကွက် / ကျေးရွာ)">
                  <input
                    type="text"
                    value={form.wardVillageName}
                    onChange={(e) => update("wardVillageName", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
            </Section>
          </div>
        )}

        {step.key === "family" && (
          <div className="space-y-5">
            <Section title="Father">
              <Row>
                <Field label="Father's Name (English)">
                  <input
                    type="text"
                    value={form.fatherNameEnglish}
                    onChange={(e) => update("fatherNameEnglish", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Father's Name (Myanmar)">
                  <input
                    type="text"
                    value={form.fatherNameMyanmar}
                    onChange={(e) => update("fatherNameMyanmar", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Occupation">
                  <input
                    type="text"
                    value={form.fatherOccupation}
                    onChange={(e) => update("fatherOccupation", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="NRC">
                  <input
                    type="text"
                    value={form.fatherNrc}
                    onChange={(e) => update("fatherNrc", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.fatherPhone}
                    onChange={(e) => update("fatherPhone", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
            </Section>
            <Section title="Mother">
              <Row>
                <Field label="Mother's Name (English)">
                  <input
                    type="text"
                    value={form.motherNameEnglish}
                    onChange={(e) => update("motherNameEnglish", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Mother's Name (Myanmar)">
                  <input
                    type="text"
                    value={form.motherNameMyanmar}
                    onChange={(e) => update("motherNameMyanmar", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Occupation">
                  <input
                    type="text"
                    value={form.motherOccupation}
                    onChange={(e) => update("motherOccupation", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="NRC">
                  <input
                    type="text"
                    value={form.motherNrc}
                    onChange={(e) => update("motherNrc", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.motherPhone}
                    onChange={(e) => update("motherPhone", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
            </Section>
            <Section title="Emergency Contact">
              <Row>
                <Field label="Name">
                  <input
                    type="text"
                    value={form.emergencyName}
                    onChange={(e) => update("emergencyName", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Relationship">
                  <input
                    type="text"
                    value={form.emergencyRelationship}
                    onChange={(e) => update("emergencyRelationship", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => update("emergencyPhone", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
              <Field label="Address">
                <textarea
                  rows={2}
                  value={form.emergencyAddress}
                  onChange={(e) => update("emergencyAddress", e.target.value)}
                  className={`${INPUT} h-auto py-2`}
                />
              </Field>
            </Section>
          </div>
        )}

        {step.key === "employment" && (
          <div className="space-y-5">
            <Section title="Current Position">
              <Row>
                <Field label="Appointment Type *">
                  <select
                    value={form.appointmentTypeId}
                    onChange={(e) => {
                      update("appointmentTypeId", e.target.value);
                      update("primaryAppointmentId", "");
                    }}
                    className={INPUT}
                  >
                    <option value="">Select type</option>
                    {appointmentTypes.map((t) => (
                      <option key={t._id} value={t._id}>
                        {typeof t.name === "object"
                          ? t.name.en || t.name.mm || t.code
                          : t.name || t.code}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Position *">
                  <select
                    value={form.primaryAppointmentId}
                    onChange={(e) => update("primaryAppointmentId", e.target.value)}
                    disabled={!form.appointmentTypeId}
                    className={`${INPUT} disabled:bg-gray-50 disabled:text-gray-400`}
                  >
                    <option value="">
                      {!form.appointmentTypeId ? "Pick a type first" : "Select position"}
                    </option>
                    {appointments.map((a) => (
                      <option key={a._id} value={a._id}>
                        {typeof a.name === "object"
                          ? a.name.en || a.name.mm || a.code
                          : a.name || a.code}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Department Type">
                  <select
                    value={form.departmentTypeFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      update("departmentTypeFilter", v);
                      // Drop the picked department if it no longer
                      // belongs to the new filter — avoids a "hidden
                      // selected" state where the value is set but
                      // the option isn't in the visible list.
                      if (v && form.primaryDepartmentId) {
                        const picked = (departments as any[]).find(
                          (d) => d._id === form.primaryDepartmentId,
                        );
                        if (picked && picked.type && picked.type !== v) {
                          update("primaryDepartmentId", "");
                        }
                      }
                    }}
                    className={INPUT}
                  >
                    <option value="">All departments</option>
                    <option value="teaching">Academic / Teaching</option>
                    <option value="admin">Administrative</option>
                  </select>
                </Field>
                <Field label="Department">
                  <select
                    value={form.primaryDepartmentId}
                    onChange={(e) => update("primaryDepartmentId", e.target.value)}
                    className={INPUT}
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
                </Field>
                <Field label="Current Position Start Date *">
                  <input
                    type="date"
                    value={form.appointmentDate}
                    onChange={(e) => update("appointmentDate", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Government Service Start Date">
                  <input
                    type="date"
                    value={form.firstJoinDate}
                    onChange={(e) => update("firstJoinDate", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
            </Section>
            <Section title="Government Order (optional)">
              <Row>
                <Field label="Order Number">
                  <input
                    type="text"
                    value={form.appointmentOrderNumber}
                    onChange={(e) => update("appointmentOrderNumber", e.target.value)}
                    className={INPUT}
                  />
                </Field>
                <Field label="Order Date">
                  <input
                    type="date"
                    value={form.appointmentOrderDate}
                    onChange={(e) => update("appointmentOrderDate", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
              <p className="text-xs text-gray-500">
                HR may fill these from the official appointment order document.
              </p>
            </Section>
          </div>
        )}

        {step.key === "history" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              List any positions you held{" "}
              <span className="font-medium">before joining this organization</span>{" "}
              — sister DHRH schools, another MOH department, or other
              ministries. Pick the organization from the list when it
              appears; otherwise type the name in.
            </p>
            {previousAppointments.map((row, i) => {
              // The free-text `organizationName` is only relevant when
              // no system org is selected. When the user picks an org
              // from the dropdown we hide the text fallback so the row
              // stays compact.
              const usingFreeText = !row.organizationId;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Appointment #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePreviousAppointment(i)}
                      disabled={previousAppointments.length === 1}
                      aria-label="Remove appointment"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Row>
                    <Field label="Organization">
                      {/* DHRH/health-sector orgs from /organizations/public-list.
                          Picking one stamps the row's organizationId so reporting
                          can resolve back to the canonical record; choosing
                          "Other" clears it and reveals the free-text field. */}
                      <select
                        value={row.organizationId}
                        onChange={(e) => {
                          const orgId = e.target.value;
                          setPreviousAppointmentField(i, "organizationId", orgId);
                          if (orgId) {
                            // Snapshot the name for offline display + denorm reports.
                            const o = publicOrgs.find((x) => x._id === orgId);
                            if (o)
                              setPreviousAppointmentField(
                                i,
                                "organizationName",
                                o.displayName?.en || o.fullName,
                              );
                          }
                        }}
                        className={INPUT}
                      >
                        <option value="">Other / not listed (type below)</option>
                        {publicOrgs.map((o) => (
                          <option key={o._id} value={o._id}>
                            {o.displayName?.en || o.fullName}
                            {o.shortName ? ` (${o.shortName})` : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {usingFreeText && (
                      <Field label="Organization name (free text)">
                        <input
                          type="text"
                          value={row.organizationName}
                          onChange={(e) =>
                            setPreviousAppointmentField(
                              i,
                              "organizationName",
                              e.target.value,
                            )
                          }
                          placeholder="Old institution name / non-listed org"
                          className={INPUT}
                        />
                      </Field>
                    )}
                    <Field label="Department / Faculty">
                      <input
                        type="text"
                        value={row.departmentName}
                        onChange={(e) =>
                          setPreviousAppointmentField(
                            i,
                            "departmentName",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. Anatomy, Registrar Office"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Position">
                      <input
                        type="text"
                        value={row.position}
                        onChange={(e) =>
                          setPreviousAppointmentField(i, "position", e.target.value)
                        }
                        placeholder="Lecturer / Deputy Director / etc."
                        className={INPUT}
                      />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Ministry">
                      <input
                        type="text"
                        value={row.ministry}
                        onChange={(e) =>
                          setPreviousAppointmentField(i, "ministry", e.target.value)
                        }
                        placeholder="Ministry of Health / Ministry of Defence / …"
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Start date">
                      <input
                        type="date"
                        value={row.startDate}
                        onChange={(e) =>
                          setPreviousAppointmentField(
                            i,
                            "startDate",
                            e.target.value,
                          )
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="End date">
                      <input
                        type="date"
                        value={row.endDate}
                        onChange={(e) =>
                          setPreviousAppointmentField(i, "endDate", e.target.value)
                        }
                        className={INPUT}
                      />
                    </Field>
                    <Field label="Reason for leaving">
                      <select
                        value={row.reasonForLeaving}
                        onChange={(e) =>
                          setPreviousAppointmentField(
                            i,
                            "reasonForLeaving",
                            e.target.value,
                          )
                        }
                        className={INPUT}
                      >
                        <option value="">—</option>
                        <option value="transferred">Transferred</option>
                        <option value="promoted">Promoted</option>
                        <option value="resigned">Resigned</option>
                        <option value="retired">Retired</option>
                        <option value="contract_ended">Contract ended</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                  </Row>
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.wasUnderMOH}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPreviousAppointmentField(i, "wasUnderMOH", checked);
                          // Auto-fill ministry on first check so the
                          // applicant doesn't have to type it. Don't
                          // override an existing typed value.
                          if (checked && !row.ministry.trim()) {
                            setPreviousAppointmentField(
                              i,
                              "ministry",
                              "Ministry of Health",
                            );
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span>Was under Ministry of Health (DHRH transfer)</span>
                    </label>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addPreviousAppointment}
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: primary }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add another previous appointment
            </button>
          </div>
        )}

        {step.key === "travel" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              List any trips abroad — trainings, conferences, study
              tours, work visits, personal travel. Used by HR for
              clearance + travel history records.
            </p>
            {foreignTravels.map((row, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Trip #{i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeForeignTravel(i)}
                    disabled={foreignTravels.length === 1}
                    aria-label="Remove trip"
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Row>
                  <Field label="Country">
                    <input
                      type="text"
                      value={row.country}
                      onChange={(e) =>
                        setForeignTravelField(i, "country", e.target.value)
                      }
                      placeholder="Japan / Singapore / Thailand"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Purpose / Reason">
                    {/* Free-text rather than enum — staff describe
                        purposes in many phrasings ("WHO conference",
                        "ICT training", "fellowship", etc.) and a fixed
                        list would push everything into "Other". */}
                    <input
                      type="text"
                      value={row.purpose}
                      onChange={(e) =>
                        setForeignTravelField(i, "purpose", e.target.value)
                      }
                      placeholder="Training / Conference / Study tour / Personal"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="From date">
                    <input
                      type="date"
                      value={row.fromDate}
                      onChange={(e) =>
                        setForeignTravelField(i, "fromDate", e.target.value)
                      }
                      className={INPUT}
                    />
                  </Field>
                  <Field label="To date">
                    <input
                      type="date"
                      value={row.toDate}
                      onChange={(e) =>
                        setForeignTravelField(i, "toDate", e.target.value)
                      }
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Sponsor / Organisation">
                    <input
                      type="text"
                      value={row.sponsorOrganization}
                      onChange={(e) =>
                        setForeignTravelField(
                          i,
                          "sponsorOrganization",
                          e.target.value,
                        )
                      }
                      placeholder="WHO / JICA / Government / Self-funded"
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Remark">
                    <input
                      type="text"
                      value={row.remark}
                      onChange={(e) =>
                        setForeignTravelField(i, "remark", e.target.value)
                      }
                      className={INPUT}
                    />
                  </Field>
                </Row>
              </div>
            ))}
            <button
              type="button"
              onClick={addForeignTravel}
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: primary }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add another trip
            </button>
          </div>
        )}

        {step.key === "education" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              Add each degree, diploma, ဖောင်ကြီးသင်တန်း, မွမ်းမံသင်တန်း,
              workshop or certification you've completed. Pick the row{" "}
              <span className="font-medium">Type</span> first — the
              fields adjust to match (degrees use Year + Grade; trainings
              use Start/End dates).
            </p>
            {educationHistory.map((row, i) => {
              // Type-driven UI. Degrees ask for "Year of graduation" +
              // grade; trainings/workshops use a date range and skip
              // grade by default. We still RENDER every field — just
              // hide the irrelevant ones — so a user can override.
              const isDegreeLike =
                row.type === "degree" || row.type === "diploma";
              const isTrainingLike =
                row.type === "foreign_service_training" ||
                row.type === "refresher" ||
                row.type === "workshop" ||
                row.type === "certification" ||
                row.type === "other";

              // Title label depends on type — degrees expect "B.A.",
              // trainings expect a course name. Both store into the
              // same `degree` field so the backend doesn't need a
              // discriminator-aware projection.
              const titleLabel = isTrainingLike
                ? "Course / Training Title"
                : "Degree";
              const titlePlaceholder = isTrainingLike
                ? "Foreign Service Course (Basic), ICT Refresher Course, …"
                : "B.A. / M.Sc. / MBBS";
              const rowHeading = isTrainingLike
                ? `Training #${i + 1}`
                : `Degree #${i + 1}`;

              return (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {rowHeading}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEducation(i)}
                      disabled={educationHistory.length === 1}
                      aria-label="Remove row"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Row>
                    <Field label="Type">
                      <select
                        value={row.type}
                        onChange={(e) =>
                          setEducationField(i, "type", e.target.value)
                        }
                        className={INPUT}
                      >
                        <option value="degree">Degree</option>
                        <option value="diploma">Diploma</option>
                        <option value="foreign_service_training">
                          ဖောင်ကြီးသင်တန်း (Foreign Service Training)
                        </option>
                        <option value="refresher">
                          မွမ်းမံသင်တန်း (Refresher Course)
                        </option>
                        <option value="workshop">Workshop / Seminar</option>
                        <option value="certification">Certification</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label={titleLabel}>
                      <input
                        type="text"
                        value={row.degree}
                        onChange={(e) =>
                          setEducationField(i, "degree", e.target.value)
                        }
                        placeholder={titlePlaceholder}
                        className={INPUT}
                      />
                    </Field>
                    {isDegreeLike && (
                      <Field label="Major / Field">
                        <input
                          type="text"
                          value={row.major}
                          onChange={(e) =>
                            setEducationField(i, "major", e.target.value)
                          }
                          placeholder="Physics / Public Health / …"
                          className={INPUT}
                        />
                      </Field>
                    )}
                    <Field label="Institution">
                      <input
                        type="text"
                        value={row.institution}
                        onChange={(e) =>
                          setEducationField(i, "institution", e.target.value)
                        }
                        placeholder={
                          isTrainingLike
                            ? "Training institute / sponsor"
                            : "University / college"
                        }
                        className={INPUT}
                      />
                    </Field>
                    {isDegreeLike && (
                      <Field label="Year (graduation)">
                        <input
                          type="number"
                          value={row.year}
                          onChange={(e) =>
                            setEducationField(i, "year", e.target.value)
                          }
                          className={INPUT}
                        />
                      </Field>
                    )}
                    {isTrainingLike && (
                      <>
                        <Field label="Start date">
                          <input
                            type="date"
                            value={row.startDate}
                            onChange={(e) =>
                              setEducationField(i, "startDate", e.target.value)
                            }
                            className={INPUT}
                          />
                        </Field>
                        <Field label="End date">
                          <input
                            type="date"
                            value={row.endDate}
                            onChange={(e) =>
                              setEducationField(i, "endDate", e.target.value)
                            }
                            className={INPUT}
                          />
                        </Field>
                      </>
                    )}
                    {isDegreeLike && (
                      <Field label="Grade">
                        <input
                          type="text"
                          value={row.grade}
                          onChange={(e) =>
                            setEducationField(i, "grade", e.target.value)
                          }
                          placeholder="First Class / Distinction"
                          className={INPUT}
                        />
                      </Field>
                    )}
                    {isTrainingLike && (
                      <Field label="Result">
                        <input
                          type="text"
                          value={row.grade}
                          onChange={(e) =>
                            setEducationField(i, "grade", e.target.value)
                          }
                          placeholder="Pass / Merit / Distinction"
                          className={INPUT}
                        />
                      </Field>
                    )}
                    <Field label="Certificate URL">
                      <input
                        type="url"
                        value={row.certificateUrl}
                        onChange={(e) =>
                          setEducationField(i, "certificateUrl", e.target.value)
                        }
                        placeholder="https://..."
                        className={INPUT}
                      />
                    </Field>
                  </Row>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addEducation}
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: primary }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add another entry
            </button>
          </div>
        )}

        {step.key === "public" && (
          <div className="space-y-5">
            <Section title="Public profile (shown on the staff directory)">
              <Row>
                <Field label="Display Title (English)">
                  <input
                    type="text"
                    value={form.publicDisplayTitleEn}
                    onChange={(e) => update("publicDisplayTitleEn", e.target.value)}
                    placeholder="Associate Professor"
                    className={INPUT}
                  />
                </Field>
                <Field label="Display Title (Myanmar)">
                  <input
                    type="text"
                    value={form.publicDisplayTitleMm}
                    onChange={(e) => update("publicDisplayTitleMm", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Bio (English)">
                  <textarea
                    rows={3}
                    value={form.publicBioEn}
                    onChange={(e) => update("publicBioEn", e.target.value)}
                    className={`${INPUT} h-auto py-2`}
                  />
                </Field>
                <Field label="Bio (Myanmar)">
                  <textarea
                    rows={3}
                    value={form.publicBioMm}
                    onChange={(e) => update("publicBioMm", e.target.value)}
                    className={`${INPUT} h-auto py-2`}
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Public Photo URL (overrides profile photo)">
                  <input
                    type="url"
                    value={form.publicPhoto}
                    onChange={(e) => update("publicPhoto", e.target.value)}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </Field>
                <Field label="Hierarchy Level (1=Rector … 5=Lecturer)">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.publicHierarchyLevel}
                    onChange={(e) => update("publicHierarchyLevel", e.target.value)}
                    className={INPUT}
                  />
                </Field>
              </Row>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[var(--color-primary,#2460B9)]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={form.publicIsVisible}
                  onChange={(e) => update("publicIsVisible", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: "var(--color-primary, #2460B9)" }}
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">
                    Show me on the public staff directory
                  </span>
                  <br />
                  When off, only HR and admin can see this profile. HR-approved
                  profiles can opt in later from the public site too.
                </span>
              </label>
            </Section>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIdx === 0}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-sm font-medium text-white transition-all hover:opacity-95 hover:shadow-md"
              style={{ backgroundColor: primary }}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 h-10 rounded-md text-sm font-medium text-white transition-all hover:opacity-95 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: primary }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isUpdate ? "Updating…" : "Submitting…"}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isUpdate ? "Save full profile" : "Submit full profile"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Layout helpers ─────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className={SECTION_TITLE}>{title}</h3>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  // Mobile = 1 col, tablet = 2 cols, desktop (≥1024px, matches the
  // wizard's `max-w-5xl` container) = 3 cols. Steps with long-text
  // fields (textareas, current/permanent addresses) override locally
  // with their own grid wrapper when the 3-col layout cramps content.
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  );
}

/**
 * Combobox with predefined options + free-text fallback. Click to
 * open, type to filter, Enter to accept the typed value when none of
 * the options match. Same UX student form uses for race/religion —
 * just rewritten with native popover semantics instead of pulling in
 * Radix Popover, since we don't have that import here.
 */
function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Seed the search input from the current value when opening
  useEffect(() => {
    if (open) setQuery(value || "");
  }, [open, value]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  const commitTyped = () => {
    const t = query.trim();
    if (t) {
      onChange(t);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${INPUT} flex items-center justify-between text-left ${
          !value ? "text-gray-400" : "text-gray-900"
        }`}
      >
        <span className="truncate">{value || placeholder || "Select"}</span>
        <ChevronsUpDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTyped();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder="Search or type custom value…"
            className="block w-full h-9 px-3 text-sm border-b border-gray-200 focus:outline-none"
          />
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <button
                type="button"
                onClick={commitTyped}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              >
                Press Enter to use "{query}"
              </button>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Check
                    className={`h-3.5 w-3.5 ${value === opt ? "opacity-100" : "opacity-0"}`}
                    style={{ color: "var(--color-primary, #2460B9)" }}
                  />
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
