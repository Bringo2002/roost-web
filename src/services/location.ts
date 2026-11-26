// Browser geolocation, shaped like the readings the backend's GPS check expects.

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAtEpochMs: number;
}

export type GeolocationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

/** Whether location is already allowed; never asks. */
export async function geolocationPermission(): Promise<GeolocationPermission> {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch {
    return 'unsupported';
  }
}

function readPosition(options: PositionOptions): Promise<LocationFix | null> {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracyMeters: p.coords.accuracy,
          capturedAtEpochMs: p.timestamp,
        }),
      () => resolve(null),
      options,
    );
  });
}

/** A quick, approximate fix (a recent cached one is fine). */
export function getCurrentFix(): Promise<LocationFix | null> {
  return readPosition({ enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 });
}

/** The best fix the device can give right now, for verifying a listing's location. */
export function getVerificationFix(): Promise<LocationFix | null> {
  return readPosition({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
}

/** Body for POST /api/properties/{id}/verify-gps. */
export function verificationPayload(fix: LocationFix): Record<string, number> {
  return {
    latitude: fix.latitude,
    longitude: fix.longitude,
    accuracyMeters: fix.accuracyMeters,
    capturedAtEpochMs: fix.capturedAtEpochMs,
  };
}
