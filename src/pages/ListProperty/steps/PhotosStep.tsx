import { useRef, useState } from 'react';
import type { ListingDraft } from '../../../types/listing';
import { MAX_PHOTOS, MIN_PHOTOS } from '../../../types/listing';
import { uploadListingPhoto, uploadListingVideo } from '../../../services/media';
import { compressImage } from '../../../utils/image';
import { Icon } from '../../../components/Icon/Icon';
import styles from '../ListProperty.module.css';

interface PhotosStepProps {
  draft: ListingDraft;
  updateDraft: (change: Partial<ListingDraft> | ((d: ListingDraft) => ListingDraft)) => void;
  error?: string;
  notify: (message: string) => void;
}

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function PhotosStep({ draft, updateDraft, error, notify }: PhotosStepProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const count = draft.imageUrls.length;
  const hasMin = count >= MIN_PHOTOS;

  const addPhotos = async (files: File[]) => {
    const remaining = MAX_PHOTOS - draft.imageUrls.length;
    if (remaining <= 0) {
      notify(`Maximum ${MAX_PHOTOS} photos per listing`);
      return;
    }
    const batch = files.slice(0, remaining);
    if (files.length > remaining) notify(`Only added ${remaining} — maximum ${MAX_PHOTOS} photos`);

    setUploading(true);
    setProgress({ done: 0, total: batch.length });
    for (const file of batch) {
      try {
        // Same limits as the app: longest edge 4096px, JPEG at 90%, EXIF (incl. GPS) stripped.
        const jpeg = await compressImage(file, { maxEdgePx: 4096, quality: 0.9, strict: true });
        const url = await uploadListingPhoto(jpeg);
        updateDraft(d => ({ ...d, imageUrls: [...d.imageUrls, url] }));
      } catch (e) {
        notify(`A photo failed to upload: ${messageOf(e)}`);
      } finally {
        setProgress(p => ({ ...p, done: p.done + 1 }));
      }
    }
    setUploading(false);
  };

  const addVideo = async (file: File) => {
    setUploadingVideo(true);
    try {
      const url = await uploadListingVideo(file);
      updateDraft({ videoUrl: url });
    } catch (e) {
      notify(`Video upload failed: ${messageOf(e)}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const onPick = (input: HTMLInputElement | null) => {
    const files = Array.from(input?.files ?? []);
    if (input) input.value = '';
    if (files.length > 0) addPhotos(files);
  };

  return (
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Property Photos</h2>
      <p className={styles.stepSubtitle}>Clear, bright shots get 3× more inquiries</p>

      <div className={`${styles.counter} ${hasMin ? styles.counterOk : ''}`} role="status">
        {hasMin
          ? `${count} photos added ✓`
          : `${count}/${MIN_PHOTOS} photos — add ${MIN_PHOTOS - count} more`}
      </div>

      {!uploading && (
        <div className={styles.pickRow}>
          {isTouchDevice() && (
            <button className={styles.pickBtn} onClick={() => cameraRef.current?.click()} type="button">
              <Icon name="camera" size={20} /> Camera
            </button>
          )}
          <button className={styles.pickBtn} onClick={() => galleryRef.current?.click()} type="button">
            <Icon name="image" size={20} /> {isTouchDevice() ? 'Gallery' : 'Choose photos'}
          </button>
        </div>
      )}

      <input ref={cameraRef} className={styles.hiddenInput} type="file" accept="image/*" capture="environment" onChange={() => onPick(cameraRef.current)} />
      <input ref={galleryRef} className={styles.hiddenInput} type="file" accept="image/*" multiple onChange={() => onPick(galleryRef.current)} />

      {uploading && (
        <div className={styles.uploading} role="status">
          <div className={styles.spinner} />
          Uploading {Math.min(progress.done + 1, progress.total)} of {progress.total}…
        </div>
      )}

      {count === 0 && !uploading && (
        <div className={`${styles.emptyPhotos} ${error ? styles.emptyPhotosError : ''}`}>
          <Icon name="image" size={36} />
          <strong>No photos yet</strong>
          <span>Natural light &amp; landscape shots of each room get the most views</span>
        </div>
      )}
      {error && <p className={styles.fieldError} role="alert">{error}</p>}

      {count > 0 && (
        <div className={styles.photoGrid}>
          {draft.imageUrls.map((url, index) => (
            <div className={styles.photoCell} key={`${url}-${index}`}>
              <img className={styles.photo} src={url} alt={`Listing photo ${index + 1}`} loading="lazy" />
              {index === 0 && <span className={styles.coverBadge}>Cover</span>}
              <button
                className={styles.removeBtn}
                onClick={() => updateDraft(d => ({ ...d, imageUrls: d.imageUrls.filter((_, i) => i !== index) }))}
                type="button"
                aria-label={`Remove photo ${index + 1}`}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.videoBlock}>
        <div className={styles.videoHead}>
          <strong>Walkthrough Video</strong>
          <span className={styles.optionalTag}>Optional</span>
        </div>
        <p className={styles.stepSubtitle}>A short walkthrough helps renters picture the space</p>

        {uploadingVideo ? (
          <div className={styles.uploading} role="status">
            <div className={styles.spinner} /> Uploading video…
          </div>
        ) : draft.videoUrl ? (
          <div className={styles.videoAttached}>
            <Icon name="video" size={18} />
            <span>Video attached</span>
            <button className={styles.linkBtn} onClick={() => updateDraft({ videoUrl: null })} type="button">Remove</button>
          </div>
        ) : (
          <button className={styles.pickBtn} onClick={() => videoRef.current?.click()} type="button">
            <Icon name="video" size={20} /> {isTouchDevice() ? 'Record or choose video' : 'Choose video'}
          </button>
        )}
        <input
          ref={videoRef}
          className={styles.hiddenInput}
          type="file"
          accept="video/mp4,video/quicktime,.mp4,.m4v,.mov"
          onChange={() => {
            const file = videoRef.current?.files?.[0];
            if (videoRef.current) videoRef.current.value = '';
            if (file) addVideo(file);
          }}
        />
      </div>
    </div>
  );
}
