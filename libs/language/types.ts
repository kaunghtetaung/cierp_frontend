// Language service types
// Reusable across multiple projects

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  direction?: 'ltr' | 'rtl';
}

export interface LanguageChangeRequest {
  language: string;
}

export interface LanguageChangeResponse {
  success: boolean;
  language: string;
  message?: string;
  error?: string;
}

export interface LanguageGetResponse {
  success: boolean;
  language: string;
  supportedLanguages: string[];
  error?: string;
}

export interface LanguageServiceConfig {
  apiEndpoint?: string;
  cookieName?: string;
  cookieOptions?: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
    path?: string;
  };
  supportedLanguages?: Language[];
  defaultLanguage?: string;
}

export interface LanguageServiceInterface {
  changeLanguage(languageCode: string): Promise<LanguageChangeResponse>;
  getCurrentLanguage(): Promise<LanguageGetResponse>;
  getStoredLanguage(): string | null;
  setStoredLanguage(languageCode: string): void;
  getSupportedLanguages(): Language[];
  isValidLanguage(languageCode: string): boolean;
  getBrowserLanguage(): string;
}