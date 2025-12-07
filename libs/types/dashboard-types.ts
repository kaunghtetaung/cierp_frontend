/**
 * Dashboard types for module analytics views
 */

import { MultilingualText } from './module-schema';

// Generic labeled count item for dashboard charts
export interface LabeledCount {
  value: string;
  label: MultilingualText;
  count: number;
}

// Simple named count item (for items without multilingual labels)
export interface NamedCount {
  name: string;
  count: number;
}

// Academic year count item
export interface AcademicYearCount {
  academicYearId: string;
  name: string;
  count: number;
}

// Batch count item
export interface BatchCount {
  batchId: string;
  academicYearId: string;
  name: string;
  count: number;
}

// Student Dashboard Response
export interface StudentDashboardResponse {
  filterBy?: {
    academicYear?: { id: string; name: string };
    batch?: { id: string; name: string };
    registrationStatus?: string;
    stateRegionName?: string;
    districtName?: string;
    townshipName?: string;
    townName?: string;
    gender?: string;
    race?: string;
    religion?: string;
    bloodType?: string;
  };

  summary: {
    totalStudents: number;
    byRegistrationStatus: {
      pending: number;
      approved: number;
      rejected: number;
      incomplete: number;
      entryByOperator: number;
    };
  };

  byClass: {
    byAcademicYear: AcademicYearCount[];
    byBatch: BatchCount[];
  };

  byRegion: {
    byStateRegion: NamedCount[];
    byDistrict: NamedCount[];
    byTownship: NamedCount[];
    byTown: NamedCount[];
  };

  byDemographics: {
    byGender: LabeledCount[];
    byRace: LabeledCount[];
    byReligion: LabeledCount[];
    byBloodType: LabeledCount[];
  };
}

// Student Dashboard Query Parameters
export interface StudentDashboardQueryParams {
  // Class filters
  'batches.academicYearId'?: string;
  'batches.batchId'?: string;
  'batches.rollNo'?: string;

  // Status filter
  registrationStatus?: 'pending' | 'approved' | 'rejected' | 'incomplete' | 'entryByOperator';

  // Location filters
  stateRegionName?: string;
  districtName?: string;
  townshipName?: string;
  townName?: string;

  // Demographics filters
  gender?: 'male' | 'female' | 'other';
  race?: string;
  religion?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
}

// Generic dashboard response wrapper
export interface DashboardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}