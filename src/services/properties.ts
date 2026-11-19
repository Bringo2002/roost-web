import { api } from './api';
import type { Property } from '../types/property';

export interface PropertyFilters {
  search?: string;
  location?: string;
  type?: string;
  houseType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  furnished?: boolean;
  verified?: boolean;
  country?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  size?: number;
  sort?: string;
}

function buildFilterQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const query = buildFilterQuery(filters);
  const endpoint = query ? `/api/properties/filter?${query}` : '/api/properties';
  const data = await api.get<Property[]>(endpoint);
  return Array.isArray(data) ? data : [];
}

export async function getPropertyById(id: number): Promise<Property> {
  return api.get<Property>(`/api/properties/${id}`);
}

export async function getSimilarProperties(id: number): Promise<Property[]> {
  const data = await api.get<Property[]>(`/api/properties/${id}/similar`);
  return Array.isArray(data) ? data : [];
}

export async function recordView(id: number): Promise<void> {
  await api.get<void>(`/api/properties/${id}/view`);
}

export async function getSavedProperties(): Promise<Property[]> {
  const data = await api.get<Property[]>('/api/properties/saved');
  return Array.isArray(data) ? data : [];
}

export async function saveProperty(id: number): Promise<void> {
  await api.post<void>(`/api/properties/${id}/save`);
}

export async function unsaveProperty(id: number): Promise<void> {
  await api.delete<void>(`/api/properties/${id}/save`);
}

export async function getMyListings(
  page = 0,
  size = 20,
  filter = 'ALL'
): Promise<{ content: Property[]; totalElements: number; totalPages: number }> {
  return api.get(`/api/v2/properties/my-listings?page=${page}&size=${size}&filter=${filter}`);
}

export async function toggleAvailability(id: number, available: boolean): Promise<void> {
  await api.patch<void>(`/api/properties/${id}/availability`, { available });
}

export async function deleteProperty(id: number): Promise<void> {
  await api.delete<void>(`/api/properties/${id}`);
}

export async function publishProperty(id: number): Promise<void> {
  await api.patch<void>(`/api/properties/${id}/publish`, {});
}

export async function createProperty(data: Partial<Property>): Promise<Property> {
  return api.post<Property>('/api/properties', data);
}

export async function updateProperty(id: number, data: Partial<Property>): Promise<Property> {
  return api.put<Property>(`/api/properties/${id}`, data);
}

export async function verifyGps(id: number, lat: number, lng: number): Promise<unknown> {
  return api.post(`/api/properties/${id}/verify-gps`, { latitude: lat, longitude: lng });
}

export async function getPropertiesByOwner(ownerId: number): Promise<Property[]> {
  const data = await api.get<Property[]>(`/api/properties/by-owner/${ownerId}`);
  return Array.isArray(data) ? data : [];
}
