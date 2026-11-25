const DEFAULT_MAX_EDGE_PX = 1600;
const DEFAULT_JPEG_QUALITY = 0.8;

export interface CompressOptions {
  maxEdgePx?: number;
  /** 0 to 1 */
  quality?: number;
  /**
   * Always return a JPEG, or throw. Needed when the destination insists on
   * JPEG bytes (listing photos); otherwise an undecodable photo is returned
   * unchanged.
   */
  strict?: boolean;
}

/**
 * Shrinks a phone photo before upload (default: longest edge 1600px, JPEG at
 * 80%). Re-encoding also strips EXIF, including any GPS position. Falls back to
 * the original file if the browser can't decode or re-encode it.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
  const maxEdge = options.maxEdgePx ?? DEFAULT_MAX_EDGE_PX;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (blob && (options.strict || blob.size < file.size)) return blob;
    if (options.strict) throw new Error('re-encoding produced no image');
    return file;
  } catch {
    if (options.strict) throw new Error("Couldn't read this photo. Try a JPEG or PNG image.");
    return file;
  }
}
