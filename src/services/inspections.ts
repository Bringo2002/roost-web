import { api } from './api';
import type {
  MoveInInspection,
  MoveInInspectionUpdate,
  RoomInspection,
} from '../types/inspection';

// Routes: MoveInInspectionController (/api/inspections).

/** Inspections the signed-in user has filed or is party to. */
export function getMyInspections(): Promise<MoveInInspection[]> {
  return api.get<MoveInInspection[]>('/api/inspections/mine');
}

export function getInspection(id: string): Promise<MoveInInspection> {
  return api.get<MoveInInspection>(`/api/inspections/${id}`);
}

/** Landlord's view of every inspection filed for one of their properties. */
export function getPropertyInspections(propertyId: number): Promise<MoveInInspection[]> {
  return api.get<MoveInInspection[]>(`/api/inspections/property/${propertyId}`);
}

export function createInspection(
  propertyId: number,
  rooms: RoomInspection[],
): Promise<MoveInInspection> {
  return api.post<MoveInInspection>('/api/inspections', { propertyId, rooms });
}

/** Also the autosave endpoint: call after every room, not just at the end. */
export function updateInspection(
  id: string,
  update: MoveInInspectionUpdate,
): Promise<MoveInInspection> {
  return api.put<MoveInInspection>(`/api/inspections/${id}`, update);
}
