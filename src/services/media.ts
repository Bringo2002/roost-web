// Same unsigned Cloudinary upload the Android app uses for inspection photos.
const CLOUD_NAME = 'roost-media';
const UPLOAD_PRESET = 'Roost_avatars';
const UPLOAD_TIMEOUT_MS = 15_000;

/** Uploads an image straight to Cloudinary and returns its secure URL. Throws on failure. */
export async function uploadImage(file: Blob, fileName = 'upload.jpg'): Promise<string> {
  const form = new FormData();
  form.append('upload_preset', UPLOAD_PRESET);
  form.append('file', file, fileName);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = (await res.json()) as { secure_url?: string };
    if (!data.secure_url) throw new Error('Upload response had no URL');
    return data.secure_url;
  } finally {
    clearTimeout(timer);
  }
}

// ── Listing media: direct-to-R2 uploads through the backend's presigned URLs ──
// Same flow as the Android app (POST /api/properties/presign-upload, PUT the
// bytes to R2, then record the content hash so identical files are reused).
// Landlords only. The R2 bucket must allow PUT from the web app's origin
// (CORS) with a Content-Type header.

import { api } from './api';

interface PresignResponse {
  existing: boolean;
  uploadUrl?: string;
  publicUrl: string;
  key?: string;
}

/** Hashing reads the whole file into memory, so very large videos skip it (and the reuse check). */
const MAX_HASHED_BYTES = 100 * 1024 * 1024;

async function sha256Hex(data: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await data.arrayBuffer());
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadToR2(
  kind: 'photo' | 'video',
  body: Blob,
  contentType: string,
): Promise<string> {
  const contentHash = body.size <= MAX_HASHED_BYTES ? await sha256Hex(body) : undefined;

  const presign = await api.post<PresignResponse>('/api/properties/presign-upload', {
    type: kind,
    ...(contentHash ? { contentHash } : {}),
  });
  if (presign.existing) return presign.publicUrl;
  if (!presign.uploadUrl || !presign.key) throw new Error('Upload is unavailable right now. Please try again.');

  const res = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });
  if (!res.ok) throw new Error(`Upload was rejected (HTTP ${res.status})`);

  if (contentHash) {
    // Records the hash for reuse; failing to do so doesn't affect this upload.
    api
      .post('/api/properties/confirm-upload', {
        contentHash,
        publicUrl: presign.publicUrl,
        key: presign.key,
        contentType,
        sizeBytes: String(body.size),
      })
      .catch(() => undefined);
  }
  return presign.publicUrl;
}

/** Uploads an already-compressed JPEG listing photo; returns its public URL. */
export function uploadListingPhoto(jpeg: Blob): Promise<string> {
  return uploadToR2('photo', jpeg, 'image/jpeg');
}

const VIDEO_EXTENSIONS = ['mp4', 'm4v', 'mov'];

/**
 * Uploads a walkthrough video (MP4 or MOV); returns its public URL. The
 * backend signs every video URL as video/mp4, so that is the type sent.
 */
export function uploadListingVideo(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!VIDEO_EXTENSIONS.includes(extension)) {
    return Promise.reject(new Error(`Unsupported video format (.${extension}). Please use MP4 or MOV.`));
  }
  return uploadToR2('video', file, 'video/mp4');
}
