import { api, ApiError } from './api';

export interface SavedListing {
  id: number;
  /** Verification state returned by the backend; typed when the verification hub lands. */
  verification?: unknown;
}

/** The backend's own reason when it has one: "make sure you're at the property" is wrong advice for an address it couldn't find. */
export function gpsVerificationFailureMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Couldn't verify your location. Make sure you're at the property, then tap \"Confirm your GPS location\" again.";
}

/** Asks the backend to check a fix against the listing's pin. Owner only; the listing must already be saved. */
export function verifyGps(id: number, payload: Record<string, number>): Promise<SavedListing> {
  return api.post<SavedListing>(`/api/properties/${id}/verify-gps`, payload);
}

/**
 * Saves the form to the backend: updates the listing if `id` is known, creates
 * it otherwise. If the listing was deleted since (404), a fresh one is created
 * so the work in the form isn't lost.
 */
export async function saveListing(id: number | null, payload: Record<string, unknown>): Promise<SavedListing> {
  if (id !== null) {
    try {
      return await api.put<SavedListing>(`/api/properties/${id}`, payload);
    } catch (e) {
      if (!(e instanceof ApiError) || e.statusCode !== 404) throw e;
    }
  }
  return api.post<SavedListing>('/api/properties', payload);
}
