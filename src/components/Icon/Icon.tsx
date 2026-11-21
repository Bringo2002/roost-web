import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Clock,
  CloudCheck,
  CloudOff,
  Copy,
  FileCheck,
  Heart,
  House,
  LayoutDashboard,
  Map,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  TriangleAlert,
  User,
  X,
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
  camera: Camera,
  'map-pin': MapPin,
  bed: Bed,
  bath: Bath,
  'chevron-right': ChevronRight,
  'file-check': FileCheck,
  clock: Clock,
  copy: Copy,
  share: Share2,
  close: X,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'check-circle': CircleCheck,
  'alert-circle': CircleAlert,
  'alert-triangle': TriangleAlert,
  'cloud-check': CloudCheck,
  'cloud-off': CloudOff,
  'shield-check': ShieldCheck,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const Component = ICONS[name];
  return <Component size={size} aria-hidden="true" {...rest} />;
}
