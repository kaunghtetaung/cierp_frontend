export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Status = "pending" | "loading" | "success" | "error";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Multi-language text support - used across content, page, section modules
export interface MultiLanguageText {
  en: string;
  mm: string;
  [key: string]: string; // Support for additional languages
}