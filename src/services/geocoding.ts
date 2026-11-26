// Turns a position into a listing area like "Kilimani, Nairobi" using
// OpenStreetMap's Nominatim: the same service the backend uses to check a
// listing's address against its pin, so the two agree on names.
// (Nominatim's public instance is for light use: one lookup per listing here.)

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
}

const LOOKUP_TIMEOUT_MS = 4_000;

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Same rule as the app: "area, town" when they differ, otherwise whichever exists. */
export function listingAreaFromAddress(address: NominatimAddress): string | null {
  const area =
    clean(address.suburb) ?? clean(address.neighbourhood) ?? clean(address.quarter) ?? clean(address.city_district);
  const town =
    clean(address.city) ??
    clean(address.town) ??
    clean(address.village) ??
    clean(address.municipality) ??
    clean(address.county);
  if (area && town && area.toLowerCase() !== town.toLowerCase()) return `${area}, ${town}`;
  return area ?? town;
}

/** Null when nothing was found or the lookup failed or timed out. */
export async function reverseGeocodeArea(latitude: number, longitude: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&accept-language=en' +
      `&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: NominatimAddress };
    return data.address ? listingAreaFromAddress(data.address) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
