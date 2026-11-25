import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { becomeHost } from '../../services/users';
import { saveListing } from '../../services/listings';
import { useListingDraft } from '../../hooks/useListingDraft';
import {
  STEP_COUNT,
  STEP_LABELS,
  buildPropertyPayload,
  validateStep,
  type StepErrors,
} from '../../types/listing';
import { Icon } from '../../components/Icon/Icon';
import { PhotosStep } from './steps/PhotosStep';
import styles from './ListProperty.module.css';

/**
 * The List a Property flow. Only hosts can list, so anyone else is first
 * offered to become one (as on the app's profile screen).
 */
export function ListPropertyPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  if (!user) {
    return <div className={styles.center}><div className={styles.spinner} /></div>;
  }
  if (user.role.toUpperCase() !== 'LANDLORD') {
    return <BecomeHost onDone={refreshUser} />;
  }
  return <ListingForm userId={user.id} />;
}

function BecomeHost({ onDone }: { onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      await becomeHost();
      await onDone();
    } catch (e) {
      setError(`Could not enable hosting: ${e instanceof Error ? e.message : String(e)}`);
      setBusy(false);
    }
  };

  return (
    <div className={styles.center}>
      <h1 className={styles.stepTitle}>Become a host</h1>
      <p className={styles.mutedText}>
        Turn on hosting to list your property and reach verified tenants directly.
      </p>
      {error && <p className={styles.fieldError} role="alert">{error}</p>}
      <button className={styles.primaryBtn} onClick={enable} disabled={busy} type="button">
        {busy ? 'Enabling…' : 'Enable hosting'}
      </button>
    </div>
  );
}

function ListingForm({ userId }: { userId: number }) {
  const navigate = useNavigate();
  const { draft, listingId, step, updateDraft, setStep, setListingId } = useListingDraft(userId);
  const [errors, setErrors] = useState<StepErrors>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const goTo = (next: number) => {
    setErrors({});
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (busy) return;
    const found = step < STEP_COUNT - 1 ? validateStep(draft, step) : {};
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    if (step < STEP_COUNT - 1) goTo(step + 1);
  };

  const saveDraft = async () => {
    setBusy(true);
    try {
      const saved = await saveListing(listingId, buildPropertyPayload(draft, { status: 'DRAFT' }));
      setListingId(saved.id);
      notify('Draft saved.');
    } catch (e) {
      notify(`Could not save draft: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => navigate('/hosting')} type="button" aria-label="Back to hosting">
          <Icon name="arrow-left" size={20} />
        </button>
        <h1 className={styles.heading}>List a Property</h1>
        <button className={styles.textBtn} onClick={saveDraft} disabled={busy} type="button">
          Save Draft
        </button>
      </div>

      <div className={styles.progress} aria-hidden="true">
        {STEP_LABELS.map((label, i) => (
          <span key={label} className={`${styles.progressSeg} ${i <= step ? styles.progressOn : ''}`} />
        ))}
      </div>
      <div className={styles.stepMeta}>
        <span>Step {step + 1} of {STEP_COUNT}</span>
        <span className={styles.stepName}>{STEP_LABELS[step]}</span>
      </div>

      {step === 0 ? (
        <PhotosStep draft={draft} updateDraft={updateDraft} error={errors.photos} notify={notify} />
      ) : (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>{STEP_LABELS[step]}</h2>
          <p className={styles.mutedText}>This step isn't built yet.</p>
        </div>
      )}

      <div className={styles.navBar}>
        {step > 0 && (
          <button className={styles.outlineBtn} onClick={() => goTo(step - 1)} disabled={busy} type="button" aria-label="Back">
            <Icon name="arrow-left" size={18} />
          </button>
        )}
        <button className={styles.primaryBtn} onClick={next} disabled={busy || step === STEP_COUNT - 1} type="button">
          Continue <Icon name="arrow-right" size={18} />
        </button>
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
