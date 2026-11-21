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
