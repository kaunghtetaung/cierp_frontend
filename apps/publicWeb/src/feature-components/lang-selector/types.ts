// Language selector types
// Based on managementpanel architecture

// Define Language type locally to avoid dependency issues
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface LangSelectorContextValue {
  currentLanguage: string;
  languages: Language[];
  changeLanguage: (languageCode: string) => Promise<void>;
  isChanging: boolean;
}

export interface LangSelectorProviderProps {
  children: React.ReactNode;
  languages?: Language[];
  initialLanguage?: string;
  onLanguageChange?: (languageCode: string) => void;
}

export interface LangSelectorWrapperProps {
  children:
    | React.ReactNode
    | ((context: LangSelectorContextValue) => React.ReactNode);
  languages?: Language[];
  initialLanguage?: string;
  className?: string;
  onLanguageChange?: (languageCode: string) => void;
}

export interface LangSelectorUIProps {
  variant?: "dropdown" | "select";
  showFlag?: boolean;
  showNativeName?: boolean;
  showName?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}
