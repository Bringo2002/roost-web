import { useEffect, useRef } from 'react';
import { shouldApplyAreaSuggestion, type ListingDraft, type StepErrors } from '../../../types/listing';
import { geolocationPermission, getCurrentFix } from '../../../services/location';
import { reverseGeocodeArea } from '../../../services/geocoding';
import { Icon } from '../../../components/Icon/Icon';
import { TextField } from '../fields';
import styles from '../ListProperty.module.css';

interface LocationStepProps {
  draft: ListingDraft;
  updateDraft: (change: Partial<ListingDraft> | ((d: ListingDraft) => ListingDraft)) => void;
  errors: StepErrors;
  clearError: (key: string) => void;
  checkingGps: boolean;
  onCapture: () => void;
}

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

export function LocationStep({ draft, updateDraft, errors, clearError, checkingGps, onCapture }: LocationStepProps) {
  const suggestionStarted = useRef(false);

  // On arriving, suggest the area from where the lister is, but only when
  // location is already allowed (the button asks) and the field is still empty.
  useEffect(() => {
    if (suggestionStarted.current || draft.location.trim() !== '') return;
    suggestionStarted.current = true;
    (async () => {
      if ((await geolocationPermission()) !== 'granted') return;
      const fix = await getCurrentFix();
      if (!fix) return;
      const area = await reverseGeocodeArea(fix.latitude, fix.longitude);
      if (!area) return;
      updateDraft(d =>
        shouldApplyAreaSuggestion(d.location, d.suggestedLocation)
          ? { ...d, location: area, suggestedLocation: area }
          : d,
      );
      clearError('locationText');
    })();
    // Runs once per visit to this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showingSuggestion = draft.suggestedLocation !== null && draft.location.trim() === draft.suggestedLocation;

  return (
    <div className={styles.stepBody}>
      <h2 className={styles.stepTitle}>Location</h2>
      <p className={styles.stepSubtitle}>Neighbourhood + GPS confirmation earns your Verified badge</p>

      <TextField
        label="Neighbourhood / street (e.g. Westlands, Main St)"
        value={draft.location}
        onChange={location => {
          updateDraft({ location });
          clearError('locationText');
        }}
        error={errors.locationText}
        autoComplete="off"
      />
      {showingSuggestion && (
        <p className={styles.hint}>Suggested from your location. Edit it if the property is somewhere else.</p>
      )}

      {!draft.locationConfirmed || draft.latitude === null || draft.longitude === null ? (
        <div className={`${styles.gpsCard} ${errors.gps ? styles.gpsCardError : ''}`}>
          <Icon name="locate" size={28} className={styles.gpsIcon} />
          <strong className={styles.gpsTitle}>Confirm your GPS location</strong>
          <p className={styles.gpsText}>
            Stand at the property and tap below.
            <br />
            This is what earns the Verified badge.
          </p>
          {errors.gps && <p className={styles.fieldError} role="alert">Required to continue</p>}
          <button className={styles.primaryBtn} onClick={onCapture} disabled={checkingGps} type="button">
            <Icon name="locate" size={16} /> {checkingGps ? 'Getting location…' : 'Use My Current Location'}
          </button>
          {!isTouchDevice() && (
            <p className={styles.hint}>
              Tip: location checks work best on a phone, where GPS is accurate to a few metres. Laptops
              usually can't pin down your position well enough.
            </p>
          )}
        </div>
      ) : (
        <div className={`${styles.gpsCard} ${draft.gpsVerified ? styles.gpsCardVerified : ''}`}>
          <Icon name={draft.gpsVerified ? 'shield-check' : 'map-pin'} size={28} className={styles.gpsIcon} />
          <strong className={styles.gpsTitle}>
            {draft.gpsVerified ? "You're at this location — confirmed" : 'Location captured'}
          </strong>
          <p className={styles.gpsCoords}>
            {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
          </p>
          {draft.gpsVerified && <p className={styles.gpsText}>This counts toward your Verified badge</p>}
          <button className={styles.linkBtn} onClick={onCapture} disabled={checkingGps} type="button">
            {checkingGps ? 'Updating…' : 'Update location'}
          </button>
        </div>
      )}
    </div>
  );
}
