import { api, ApiError } from './api';

export interface SavedListing {
  id: number;
  /** Verification state returned by the backend; typed when the verification hub lands. */
  verification?: unknown;
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
