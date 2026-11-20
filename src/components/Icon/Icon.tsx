import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  Heart,
  House,
  LayoutDashboard,
  Map,
  MessageSquare,
  Play,
  Plus,
  Search,
  Settings,
  User,
  type LucideProps,
} from 'lucide-react';

// Single place that decides which icon each name maps to, so every screen
// uses the same set. Add new names here as screens are built.
const ICONS = {
  home: House,
  search: Search,
  map: Map,
  play: Play,
  heart: Heart,
  message: MessageSquare,
  'clipboard-check': ClipboardCheck,
  dashboard: LayoutDashboard,
  user: User,
  settings: Settings,
  bell: Bell,
  'chevron-down': ChevronDown,
  plus: Plus,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} aria-hidden="true" {...rest} />;
}
