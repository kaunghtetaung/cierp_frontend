// UI component types with strict type safety
export type ThemeMode = 'light' | 'dark' | 'system';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly asChild?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
}

export interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: React.ReactNode;
}

export interface ToastProps {
  readonly id: string;
  readonly title?: string;
  readonly description?: string;
  readonly variant?: 'default' | 'destructive';
  readonly duration?: number;
  readonly action?: React.ReactNode;
}

export interface LoadingSpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

export interface AvatarProps {
  readonly src?: string;
  readonly alt: string;
  readonly fallback: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

export interface BadgeProps {
  readonly variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  readonly children: React.ReactNode;
}

export interface CardProps {
  readonly className?: string;
  readonly children: React.ReactNode;
}

export interface InputProps {
  readonly type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  readonly placeholder?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly error?: string;
}

export interface SelectProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly children: React.ReactNode;
}

export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly icon?: React.ReactNode;
  readonly badge?: number | string;
  readonly isActive?: boolean;
  readonly isDisabled?: boolean;
  readonly children?: NavigationItem[];
}

export interface NavigationProps {
  readonly items: NavigationItem[];
  readonly onItemClick?: (item: NavigationItem) => void;
  readonly activeItemId?: string;
  readonly collapsed?: boolean;
}

export interface ThemeProviderProps {
  readonly children: React.ReactNode;
  readonly defaultTheme?: ThemeMode;
  readonly storageKey?: string;
  readonly attribute?: string;
  readonly enableSystem?: boolean;
  readonly disableTransitionOnChange?: boolean;
}