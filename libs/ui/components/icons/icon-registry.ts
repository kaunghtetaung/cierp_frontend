// Icon Registry with Categories
// Comprehensive icon system with categorized Lucide icons and custom social icons
import * as LucideIcons from 'lucide-react';
import { CUSTOM_SOCIAL_ICONS, isCustomSocialIcon } from './custom-icons';

// Icon categories for organization
export const ICON_CATEGORIES = {
  interface: {
    label: 'Interface',
    description: 'Common UI elements and interface icons',
  },
  navigation: {
    label: 'Navigation',
    description: 'Navigation, directions, and movement icons',
  },
  content: {
    label: 'Content',
    description: 'Text, media, and content-related icons',
  },
  actions: {
    label: 'Actions',
    description: 'User actions and interactive elements',
  },
  communication: {
    label: 'Communication',
    description: 'Communication, contact, and messaging icons',
  },
  social: {
    label: 'Social',
    description: 'Social media and platform icons',
  },
  media: {
    label: 'Media',
    description: 'Audio, video, and multimedia icons',
  },
  files: {
    label: 'Files',
    description: 'File types and document icons',
  },
  devices: {
    label: 'Devices',
    description: 'Hardware and device icons',
  },
  business: {
    label: 'Business',
    description: 'Business, finance, and professional icons',
  },
  nature: {
    label: 'Nature',
    description: 'Weather, nature, and environment icons',
  },
  medical: {
    label: 'Medical',
    description: 'Healthcare, medical, and wellness icons',
  },
  education: {
    label: 'Education',
    description: 'Learning, academic, and educational icons',
  },
  emoji: {
    label: 'Emoji',
    description: 'Emoji and emotional expression icons',
  },
  other: {
    label: 'Other',
    description: 'Miscellaneous icons',
  },
} as const;

export type IconCategory = keyof typeof ICON_CATEGORIES;

// Icon registry with categorization
export const ICON_REGISTRY: Record<IconCategory, string[]> = {
  // Interface icons
  interface: [
    'Home', 'Menu', 'Search', 'Settings', 'User', 'Users', 'Crown',
    'Star', 'Heart', 'Eye', 'EyeOff', 'Bell', 'BellOff', 'Info',
    'AlertCircle', 'AlertTriangle', 'CheckCircle', 'XCircle', 'X',
    'Plus', 'Minus', 'MoreHorizontal', 'MoreVertical', 'Grid',
    'List', 'Filter', 'SortAsc', 'SortDesc', 'Maximize', 'Minimize',
    'Layout', 'LayoutGrid', 'LayoutList', 'Sidebar', 'Panels',
  ],
  
  // Navigation icons
  navigation: [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUpDown',
    'ArrowLeftRight', 'ChevronUp', 'ChevronDown', 'ChevronLeft', 'ChevronRight',
    'ChevronsUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight',
    'Navigation', 'Compass', 'Map', 'MapPin', 'Route', 'Signpost',
    'ExternalLink', 'Link', 'Unlink', 'CornerDownLeft', 'CornerDownRight',
    'CornerUpLeft', 'CornerUpRight', 'Move', 'MoveHorizontal', 'MoveVertical',
  ],
  
  // Content icons
  content: [
    'FileText', 'File', 'Folder', 'FolderOpen', 'Image', 'Video',
    'Music', 'Headphones', 'Mic', 'Camera', 'Bookmark', 'BookmarkPlus',
    'Book', 'BookOpen', 'Library', 'Newspaper', 'Type', 'AlignLeft',
    'AlignCenter', 'AlignRight', 'AlignJustify', 'Bold', 'Italic',
    'Underline', 'Quote', 'Hash', 'Heading1', 'Heading2', 'Heading3',
  ],
  
  // Action icons
  actions: [
    'Play', 'Pause', 'Stop', 'Rewind', 'FastForward', 'SkipBack',
    'SkipForward', 'Repeat', 'Shuffle', 'Volume', 'VolumeOff', 'Volume1',
    'Volume2', 'Edit', 'Edit3', 'Copy', 'Paste', 'Cut', 'Save',
    'Download', 'Upload', 'Share', 'Send', 'Trash', 'Trash2',
    'Delete', 'Refresh', 'RotateCw', 'RotateCcw', 'Undo', 'Redo',
  ],
  
  // Communication icons
  communication: [
    'Mail', 'MessageCircle', 'MessageSquare', 'Phone', 'PhoneCall',
    'PhoneOff', 'Video', 'VideoOff', 'Mic', 'MicOff', 'Wifi',
    'WifiOff', 'Signal', 'Bluetooth', 'Rss', 'AtSign', 'Mention',
    'Hash', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
    'Contact', 'Contacts', 'Globe', 'Languages', 'Translate',
  ],
  
  // Social icons (custom and Lucide)
  social: [
    // Custom social icons
    'Facebook', 'X', 'Google', 'Microsoft', 'LinkedIn', 'Instagram',
    'YouTube', 'GitHub', 'TikTok',
    // Lucide social-related icons
    'Share', 'Share2', 'ExternalLink', 'Link', 'Bookmark', 'BookmarkPlus',
    'Heart', 'HeartHandshake', 'ThumbsUp', 'ThumbsDown', 'Users',
    'UserPlus', 'UserCheck', 'MessageCircle', 'MessageSquare', 'Mail',
    'Globe', 'Rss', 'Wifi', 'Signal', 'Smartphone', 'Monitor',
  ],
  
  // Media icons
  media: [
    'Image', 'Images', 'Video', 'Film', 'Camera', 'CameraOff',
    'Music', 'Disc', 'Radio', 'Tv', 'Monitor', 'Smartphone',
    'Tablet', 'Laptop', 'Speaker', 'Headphones', 'Mic', 'MicOff',
    'Volume', 'VolumeOff', 'Volume1', 'Volume2', 'Play', 'Pause',
    'Stop', 'Rewind', 'FastForward', 'SkipBack', 'SkipForward',
  ],
  
  // Files icons
  files: [
    'File', 'FileText', 'FileImage', 'FileVideo', 'FileAudio',
    'FilePdf', 'FileCode', 'FileJson', 'FileSpreadsheet', 'Folder',
    'FolderOpen', 'FolderPlus', 'Archive', 'Package', 'Paperclip',
    'Link', 'Download', 'Upload', 'HardDrive', 'Database', 'Server',
    'Cloud', 'CloudDownload', 'CloudUpload', 'CloudOff', 'Save',
  ],
  
  // Devices icons
  devices: [
    'Smartphone', 'Tablet', 'Laptop', 'Monitor', 'Tv', 'Speaker',
    'Headphones', 'Mouse', 'Keyboard', 'Printer', 'Scanner', 'Webcam',
    'Router', 'Wifi', 'Bluetooth', 'Usb', 'HardDrive', 'Battery',
    'BatteryLow', 'Plug', 'Power', 'PowerOff', 'Cpu', 'MemoryStick',
    'SdCard', 'Disc', 'Radio', 'Watch', 'Gamepad2', 'Joystick',
  ],
  
  // Business icons
  business: [
    'Building', 'Building2', 'Store', 'ShoppingCart', 'ShoppingBag',
    'CreditCard', 'DollarSign', 'Euro', 'PoundSterling', 'Coins',
    'Wallet', 'Receipt', 'Calculator', 'TrendingUp', 'TrendingDown',
    'BarChart', 'LineChart', 'PieChart', 'Target', 'Award', 'Trophy',
    'Medal', 'Briefcase', 'Calendar', 'Clock', 'Timer', 'Stopwatch',
    'User', 'Users', 'UserPlus', 'UserCheck', 'Contact', 'BadgeCheck',
  ],
  
  // Nature icons
  nature: [
    'Sun', 'Moon', 'Star', 'Cloud', 'CloudRain', 'CloudSnow',
    'CloudLightning', 'Umbrella', 'Snowflake', 'Droplets', 'Wind',
    'Thermometer', 'Flower', 'Flower2', 'Trees', 'Tree', 'Leaf',
    'Mountain', 'Mountains', 'Waves', 'Flame', 'Zap', 'Bug',
    'Fish', 'Bird', 'Rabbit', 'Dog', 'Cat', 'PawPrint', 'Feather',
  ],
  
  // Medical icons
  medical: [
    'Heart', 'HeartPulse', 'Activity', 'Stethoscope', 'Thermometer',
    'Pill', 'Syringe', 'Bandage', 'Cross', 'Plus', 'Minus',
    'Hospital', 'Ambulance', 'FirstAid', 'Shield', 'ShieldCheck',
    'UserCheck', 'Users', 'Baby', 'Accessibility', 'Wheelchair',
    'Eye', 'EyeOff', 'Ear', 'Brain', 'Zap', 'Activity',
    'HeartHandshake', 'Smile', 'Frown', 'Meh', 'Timer',
    'Clock', 'Calendar', 'CalendarDays', 'FileText', 'Clipboard',
    'ClipboardCheck', 'ClipboardList', 'Scan', 'Search', 'TestTube',
    'Microscope', 'Dna', 'Gauge', 'TrendingUp', 'TrendingDown',
    'BarChart', 'PieChart', 'Bed', 'Bath', 'Utensils',
  ],
  
  // Education icons
  education: [
    'GraduationCap', 'Book', 'BookOpen', 'Library', 'School',
    'University', 'Notebook', 'PenTool', 'Pencil', 'Edit',
    'Calculator', 'Ruler', 'Triangle', 'Square', 'Circle',
    'Compass', 'Globe', 'Map', 'MapPin', 'Languages',
    'Microscope', 'TestTube', 'Beaker', 'Atom', 'Dna',
    'Brain', 'Lightbulb', 'Target', 'Award', 'Trophy',
    'Medal', 'Star', 'Bookmark', 'BookmarkPlus', 'Tag',
    'Tags', 'Hash', 'Type', 'AlignLeft', 'AlignCenter',
    'AlignRight', 'List', 'ListOrdered', 'CheckSquare', 'Calendar',
    'CalendarDays', 'Clock', 'Timer', 'Stopwatch', 'Users',
    'UserPlus', 'Presentation', 'Monitor', 'Projector', 'Volume2',
    'Headphones', 'Play', 'Pause', 'Video', 'Camera',
    'Image', 'FileText', 'File', 'Folder', 'Archive',
    'Download', 'Upload', 'Link', 'ExternalLink', 'Search',
  ],
  
  // Emoji icons
  emoji: [
    'Smile', 'Frown', 'Meh', 'Laugh', 'Heart', 'HeartHandshake',
    'ThumbsUp', 'ThumbsDown', 'PartyPopper', 'Gift', 'Cake',
    'Coffee', 'Wine', 'Pizza', 'Apple', 'Cherry', 'Grape',
    'Banana', 'Car', 'Plane', 'Train', 'Bike', 'Rocket', 'Ship',
    'Anchor', 'Tent', 'Home', 'Castle', 'Church', 'School',
  ],
  
  // Other icons
  other: [
    'Zap', 'Flame', 'Droplet', 'Snowflake', 'Wind', 'Leaf',
    'Bug', 'Fish', 'Bird', 'Feather', 'Eye', 'Fingerprint',
    'Key', 'Lock', 'Unlock', 'Shield', 'ShieldCheck', 'ShieldAlert',
    'Flag', 'MapPin', 'Compass', 'Clock', 'Calendar', 'Hourglass',
    'Infinity', 'Hexagon', 'Triangle', 'Square', 'Circle', 'Diamond',
    'Pentagon', 'Octagon', 'Puzzle', 'Gamepad', 'Dice1', 'Dice6',
  ],
};

// Type for valid icon names
export type IconName = string;

// All available icons (flattened)
export const ALL_ICONS: string[] = Object.values(ICON_REGISTRY).flat();

// Helper to get icon component from Lucide or custom icons
export function getIconComponent(iconName: string) {
  // Check for custom social icons first
  if (isCustomSocialIcon(iconName)) {
    return CUSTOM_SOCIAL_ICONS[iconName as keyof typeof CUSTOM_SOCIAL_ICONS];
  }
  
  // Handle Lucide icons
  const iconKey = iconName as keyof typeof LucideIcons;
  
  if (iconKey in LucideIcons) {
    return LucideIcons[iconKey] as React.ComponentType<any>;
  }
  
  // Fallback to HelpCircle if icon not found
  return LucideIcons.HelpCircle;
}

// Helper to check if icon exists (either Lucide or custom)
export function isValidIcon(iconName: string): boolean {
  return isCustomSocialIcon(iconName) || iconName in LucideIcons;
}

// Helper to get icons by category
export function getIconsByCategory(category: IconCategory): string[] {
  return ICON_REGISTRY[category] || [];
}

// Helper to search icons
export function searchIcons(query: string): { iconName: string; category: IconCategory }[] {
  const lowerQuery = query.toLowerCase();
  const results: { iconName: string; category: IconCategory }[] = [];
  
  Object.entries(ICON_REGISTRY).forEach(([category, icons]) => {
    icons.forEach(iconName => {
      if (iconName.toLowerCase().includes(lowerQuery)) {
        results.push({ iconName, category: category as IconCategory });
      }
    });
  });
  
  return results;
}

// Helper to get icon info
export function getIconInfo(iconName: string) {
  for (const [category, icons] of Object.entries(ICON_REGISTRY)) {
    if (icons.includes(iconName)) {
      return {
        iconName,
        category: category as IconCategory,
        categoryLabel: ICON_CATEGORIES[category as IconCategory].label,
        exists: isValidIcon(iconName),
      };
    }
  }
  
  return {
    iconName,
    category: 'other' as IconCategory,
    categoryLabel: 'Other',
    exists: isValidIcon(iconName),
  };
}