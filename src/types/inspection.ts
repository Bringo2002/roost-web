// Mirrors MoveInInspectionResponseDto (Roost backend) and the Flutter
// MoveInInspection model field-for-field.

export type ItemCondition = 'good' | 'minorWear' | 'damaged' | 'notApplicable';

export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  good: 'Good',
  minorWear: 'Minor Wear',
  damaged: 'Damaged',
  notApplicable: 'N/A',
};

export const CONDITION_EMOJI: Record<ItemCondition, string> = {
  good: '✅',
  minorWear: '⚠️',
  damaged: '❌',
  notApplicable: '➖',
};

/** Display order of the condition buttons. */
export const ITEM_CONDITIONS: ItemCondition[] = ['good', 'minorWear', 'damaged', 'notApplicable'];

export interface InspectionItem {
  name: string;
  condition: ItemCondition;
  notes: string;
  photoUrls: string[];
  isInspected: boolean;
}

export interface RoomInspection {
  roomName: string;
  roomIcon: string;
  items: InspectionItem[];
}

export interface MoveInInspection {
  id: string;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  landlordName: string | null;
  createdAt: string;
  completedAt: string | null;
  rooms: RoomInspection[];
  tenantSignature: string | null;
  landlordSignature: string | null;
  meterElectricity: string | null;
  meterWater: string | null;
}

/** Body for PUT /api/inspections/{id}. Every field is optional; omit to leave unchanged. */
export interface MoveInInspectionUpdate {
  rooms?: RoomInspection[];
  meterElectricity?: string;
  meterWater?: string;
  tenantSignature?: string;
  landlordSignature?: string;
  markComplete?: boolean;
}

// ── Derived values (same rules as the app's model getters) ──────────────

export function isRoomComplete(room: RoomInspection): boolean {
  return room.items.every(item => item.isInspected);
}

export function roomIssueCount(room: RoomInspection): number {
  return room.items.filter(item => item.condition === 'damaged').length;
}

export function roomWearCount(room: RoomInspection): number {
  return room.items.filter(item => item.condition === 'minorWear').length;
}

export function totalItems(inspection: MoveInInspection): number {
  return inspection.rooms.reduce((sum, room) => sum + room.items.length, 0);
}

export function inspectedItems(inspection: MoveInInspection): number {
  return inspection.rooms.reduce(
    (sum, room) => sum + room.items.filter(item => item.isInspected).length,
    0,
  );
}

export function totalIssues(inspection: MoveInInspection): number {
  return inspection.rooms.reduce((sum, room) => sum + roomIssueCount(room), 0);
}

/** 0–1 */
export function completionPercentage(inspection: MoveInInspection): number {
  const total = totalItems(inspection);
  return total === 0 ? 0 : inspectedItems(inspection) / total;
}

export function isInspectionComplete(inspection: MoveInInspection): boolean {
  return (
    inspection.rooms.every(isRoomComplete) &&
    inspection.tenantSignature !== null &&
    inspection.landlordSignature !== null
  );
}

export function conditionCounts(inspection: MoveInInspection): { good: number; wear: number; damaged: number } {
  let good = 0;
  let wear = 0;
  let damaged = 0;
  for (const room of inspection.rooms) {
    for (const item of room.items) {
      if (item.condition === 'good') good++;
      else if (item.condition === 'minorWear') wear++;
      else if (item.condition === 'damaged') damaged++;
    }
  }
  return { good, wear, damaged };
}

// ── Template for a new inspection (same rooms and items as the app) ──────

function room(roomName: string, roomIcon: string, itemNames: string[]): RoomInspection {
  return {
    roomName,
    roomIcon,
    items: itemNames.map(name => ({
      name,
      condition: 'good' as const,
      notes: '',
      photoUrls: [],
      isInspected: false,
    })),
  };
}

export function createDefaultRooms(): RoomInspection[] {
  return [
    room('Living Room', '🛋️', ['Walls & Paint', 'Flooring', 'Windows & Curtains', 'Light Fixtures', 'Electrical Outlets', 'Door & Lock']),
    room('Kitchen', '🍳', ['Sink & Plumbing', 'Countertops', 'Cabinets & Shelves', 'Stove/Cooktop', 'Exhaust/Ventilation', 'Flooring']),
    room('Master Bedroom', '🛏️', ['Walls & Paint', 'Flooring', 'Windows & Curtains', 'Built-in Wardrobes', 'Light Fixtures', 'Door & Lock']),
    room('Bathroom', '🚿', ['Toilet', 'Shower/Bathtub', 'Sink & Mirror', 'Tiles & Grouting', 'Plumbing (Hot/Cold)', 'Ventilation']),
    room('Utility & Meters', '⚡', ['Main Door & Lock', 'Electricity Meter', 'Water Meter', 'Circuit Breaker', 'Fire Safety Equipment']),
  ];
}
