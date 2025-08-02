// User menu types
// Based on managementpanel architecture

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roles: string[];
  isAuthenticated: boolean;
}

export interface UserMenuContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

export interface UserMenuProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export interface UserMenuProps {
  showTextOnMobile?: boolean;
  signInText?: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOnlineStatus?: boolean;
}

export interface SignInButtonProps {
  text?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export interface UserDropdownProps {
  user: User;
  onSignOut: () => void;
  className?: string;
}