import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPropertyById } from '../../services/properties';
import { createInspection, getMyInspections, updateInspection } from '../../services/inspections';
import type { Property } from '../../types/property';
import {
  CONDITION_EMOJI,
  ITEM_CONDITIONS,
  ITEM_CONDITION_LABELS,
  conditionCounts,
  createDefaultRooms,
  roomIssueCount,
  roomWearCount,
  totalItems,
  type ItemCondition,
  type MoveInInspection,
  type RoomInspection,
} from '../../types/inspection';
import { generateInspectionReport } from '../../utils/inspectionReport';
import { Icon } from '../../components/Icon/Icon';
import styles from './InspectionWizard.module.css';

const AUTOSAVE_DEBOUNCE_MS = 800;

/** Marks an inspection that exists only on this screen (the server round trip failed). */
const UNSAVED_ID = '';

interface Loaded {
  property: Property;
  inspection: MoveInInspection;
  saveFailed: boolean;
}

/**
 * Room-by-room move-in inspection. Resumes the tenant's in-progress inspection
 * for this property if there is one, otherwise starts a new one, and autosaves
 * after every change so progress survives a closed tab.
 */
export function InspectionWizardPage() {
  const { id } = useParams();
  const propertyId = Number(id);
  const navigate = useNavigate();
  const { isAuthenticated, user, tokenUser } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [inspection, setInspection] = useState<MoveInInspection | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [roomIndex, setRoomIndex] = useState(0);
  const [showingSummary, setShowingSummary] = useState(false);
  const [meterElectricity, setMeterElectricity] = useState('');
  const [meterWater, setMeterWater] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // The latest inspection, readable from timers and async callbacks that would
  // otherwise close over stale state.
  const inspectionRef = useRef<MoveInInspection | null>(null);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Shared by React StrictMode's double effect run so only one inspection is created.
  const initPromise = useRef<Promise<Loaded> | null>(null);

  const tenantName = user?.name || tokenUser?.name || 'Tenant';

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  // ── Load: resume or create ─────────────────────────────────────────────
  const initialize = useCallback(async (): Promise<Loaded> => {
    const loadedProperty = await getPropertyById(propertyId);
    try {
      const mine = await getMyInspections();
      const resumable = mine.find(i => i.propertyId === propertyId && i.completedAt === null);
      const current = resumable ?? (await createInspection(propertyId, createDefaultRooms()));
      return { property: loadedProperty, inspection: current, saveFailed: false };
    } catch {
      // Keep the wizard usable; the tenant is told their work isn't being saved.
      return {
        property: loadedProperty,
        saveFailed: true,
        inspection: {
          id: UNSAVED_ID,
          propertyId,
          propertyTitle: loadedProperty.title,
          tenantName,
          landlordName: null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          rooms: createDefaultRooms(),
          tenantSignature: null,
          landlordSignature: null,
          meterElectricity: null,
          meterWater: null,
        },
      };
    }
  }, [propertyId, tenantName]);

  useEffect(() => {
    if (!isAuthenticated || Number.isNaN(propertyId)) return;
    let cancelled = false;
    initPromise.current ??= initialize();
    initPromise.current
      .then(loaded => {
        if (cancelled) return;
        inspectionRef.current = loaded.inspection;
        setProperty(loaded.property);
        setInspection(loaded.inspection);
        setSaveFailed(loaded.saveFailed);
        setMeterElectricity(loaded.inspection.meterElectricity ?? '');
        setMeterWater(loaded.inspection.meterWater ?? '');
        setInitializing(false);
      })
      .catch(() => {
        if (cancelled) return;
        initPromise.current = null;
        setInitError("Couldn't start your inspection. Check your connection and try again.");
        setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, propertyId, initialize, attempt]);

  const retryInit = () => {
    initPromise.current = null;
    setInitError(null);
    setInitializing(true);
    setAttempt(n => n + 1);
  };

  // ── Autosave ───────────────────────────────────────────────────────────
  const flushSave = useCallback(() => {
    const current = inspectionRef.current;
    if (!current || current.id === UNSAVED_ID) return;
    // One request at a time, always sending the newest rooms, so a slow
    // earlier save can never overwrite a later one.
    saveChain.current = saveChain.current.then(async () => {
      const latest = inspectionRef.current;
      if (!latest) return;
      try {
        await updateInspection(latest.id, { rooms: latest.rooms });
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    });
  }, []);

  const scheduleSave = useCallback(
    (immediate: boolean) => {
      if (!inspectionRef.current || inspectionRef.current.id === UNSAVED_ID) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (immediate) {
        debounceTimer.current = null;
        flushSave();
      } else {
        debounceTimer.current = setTimeout(() => {
          debounceTimer.current = null;
          flushSave();
        }, AUTOSAVE_DEBOUNCE_MS);
      }
    },
    [flushSave],
  );

  // Typing that is still waiting on the debounce is saved when the tenant leaves.
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        flushSave();
      }
    };
  }, [flushSave]);

  const mutate = (change: (i: MoveInInspection) => MoveInInspection, immediate = false) => {
    const current = inspectionRef.current;
    if (!current) return;
    const next = change(current);
    inspectionRef.current = next;
    setInspection(next);
    scheduleSave(immediate);
  };

  const updateCurrentRoom = (change: (r: RoomInspection) => RoomInspection) => (i: MoveInInspection) => ({
    ...i,
    rooms: i.rooms.map((r, idx) => (idx === roomIndex ? change(r) : r)),
  });

  const setCondition = (itemIndex: number, condition: ItemCondition) =>
    mutate(
      updateCurrentRoom(r => ({
        ...r,
        items: r.items.map((item, k) => (k === itemIndex ? { ...item, condition, isInspected: true } : item)),
      })),
      true,
    );

  const setNotes = (itemIndex: number, notes: string) =>
    mutate(
      updateCurrentRoom(r => ({
        ...r,
        items: r.items.map((item, k) => (k === itemIndex ? { ...item, notes } : item)),
      })),
    );

  // ── Navigation ─────────────────────────────────────────────────────────
  const nextRoom = () => {
    if (!inspection) return;
    if (roomIndex < inspection.rooms.length - 1) {
      setRoomIndex(roomIndex + 1);
    } else {
      mutate(i => ({
        ...i,
        meterElectricity: meterElectricity.trim() || null,
        meterWater: meterWater.trim() || null,
      }));
      setShowingSummary(true);
    }
    scheduleSave(true);
    window.scrollTo({ top: 0 });
  };

  const prevRoom = () => {
    if (showingSummary) setShowingSummary(false);
    else if (roomIndex > 0) setRoomIndex(roomIndex - 1);
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (showingSummary || roomIndex > 0) prevRoom();
    else navigate(`/property/${propertyId}`);
  };

  // ── Finish: mark complete, then copy / share the report ────────────────
  const finalizeAndGenerateReport = async (): Promise<string> => {
    const current = inspectionRef.current as MoveInInspection;
    const electricity = meterElectricity.trim() || null;
    const water = meterWater.trim() || null;
    const completed: MoveInInspection = {
      ...current,
      completedAt: new Date().toISOString(),
      meterElectricity: electricity,
      meterWater: water,
    };
    inspectionRef.current = completed;
    setInspection(completed);

    if (current.id !== UNSAVED_ID) {
      try {
        await updateInspection(current.id, {
          rooms: completed.rooms,
          meterElectricity: electricity ?? undefined,
          meterWater: water ?? undefined,
          markComplete: true,
        });
      } catch {
        // Still hand over the report: the tenant's evidence is valuable regardless.
      }
    }
    return generateInspectionReport(completed);
  };

  const copyReport = async () => {
    const report = await finalizeAndGenerateReport();
    try {
      await navigator.clipboard.writeText(report);
      setToast('Deposit Protection Report copied to clipboard!');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Couldn't copy the report. Select and copy it from the share option instead.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const shareReport = async () => {
    const report = await finalizeAndGenerateReport();
    try {
      await navigator.share({
        title: `Move-in Inspection Report — ${property?.title ?? inspection?.propertyTitle ?? ''}`,
        text: report,
      });
    } catch {
      /* the person dismissed the share sheet */
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (Number.isNaN(propertyId)) {
    return <div className={styles.center}><p className={styles.mutedText}>That property doesn't exist.</p></div>;
  }

  if (initializing) {
    return <div className={styles.center}><div className={styles.spinner} /></div>;
  }

  if (initError || !inspection || !property) {
    return (
      <div className={styles.center}>
        <p className={styles.mutedText}>{initError ?? "Couldn't start your inspection."}</p>
        <button className={styles.outlineBtn} onClick={retryInit} type="button">Retry</button>
      </div>
    );
  }

  const room = inspection.rooms[roomIndex];
  const isLastRoom = roomIndex === inspection.rooms.length - 1;
  const counts = conditionCounts(inspection);
  const now = new Date();

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={goBack} type="button" aria-label="Back">
          <Icon name="arrow-left" size={20} />
        </button>
        <h1 className={styles.heading}>{showingSummary ? 'Inspection Summary' : room.roomName}</h1>
        <span
          className={`${styles.saveState} ${saveFailed ? styles.saveStateFailed : ''}`}
          title={
            saveFailed
              ? 'Not saved — check your connection. Your work stays on this screen until you retry.'
              : 'Saved'
          }
          role="status"
          aria-label={saveFailed ? 'Not saved' : 'Saved'}
        >
          <Icon name={saveFailed ? 'cloud-off' : 'cloud-check'} size={18} />
        </span>
        {!showingSummary && (
          <span className={styles.counter}>{roomIndex + 1} / {inspection.rooms.length}</span>
        )}
      </div>

      {saveFailed && (
        <div className={styles.banner} role="alert">
          Not saved — check your connection. Your work stays on this screen until you retry.
        </div>
      )}

      {showingSummary ? (
        <div className={styles.summary}>
          <div className={styles.propertyCard}>
            <div className={styles.propertyTitle}>{property.title}</div>
            <div className={styles.propertyLocation}>{property.location}</div>
            <div className={styles.propertyDate}>
              Inspected on{' '}
              {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} –{' '}
              {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalItems(inspection)}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.stat}>
              <Icon name="check-circle" size={16} />
              <span className={styles.statValue}>{counts.good}</span>
              <span className={styles.statLabel}>Good</span>
            </div>
            <div className={styles.stat}>
              <Icon name="alert-triangle" size={16} />
              <span className={styles.statValue}>{counts.wear}</span>
              <span className={styles.statLabel}>Wear</span>
            </div>
            <div className={styles.stat}>
              <Icon name="alert-circle" size={16} />
              <span className={styles.statValue}>{counts.damaged}</span>
              <span className={styles.statLabel}>Damaged</span>
            </div>
          </div>

          <SectionHeader title="METER READINGS" />
          <div className={styles.meterRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>⚡ Electricity Meter</span>
              <input
                className={styles.input}
                inputMode="numeric"
                value={meterElectricity}
                onChange={e => setMeterElectricity(e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>💧 Water Meter</span>
              <input
                className={styles.input}
                inputMode="numeric"
                value={meterWater}
                onChange={e => setMeterWater(e.target.value)}
              />
            </label>
          </div>

          <SectionHeader title="ROOM BREAKDOWN" />
          <div className={styles.roomList}>
            {inspection.rooms.map(r => (
              <RoomSummaryCard key={r.roomName} room={r} />
            ))}
          </div>

          <div className={styles.note}>
            <Icon name="shield-check" size={16} />
            <span>
              This report serves as evidence of property condition at move-in. Share it with your host
              for mutual agreement.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.progress} aria-hidden="true">
            {inspection.rooms.map((r, i) => (
              <span
                key={r.roomName}
                className={`${styles.progressSeg} ${
                  i === roomIndex ? styles.progressActive : i < roomIndex ? styles.progressDone : ''
                }`}
              />
            ))}
          </div>

          <div className={styles.items}>
            {room.items.map((item, i) => (
              <div
                key={`${room.roomName}-${item.name}-${i}`}
                className={`${styles.itemCard} ${
                  item.condition === 'damaged'
                    ? styles.itemDamaged
                    : item.condition === 'minorWear'
                      ? styles.itemWear
                      : ''
                }`}
              >
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.conditions} role="group" aria-label={`Condition of ${item.name}`}>
                  {ITEM_CONDITIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.conditionBtn} ${item.condition === c ? styles.conditionSelected : ''}`}
                      aria-pressed={item.condition === c}
                      onClick={() => setCondition(i, c)}
                    >
                      <span className={styles.conditionEmoji}>{CONDITION_EMOJI[c]}</span>
                      <span>{ITEM_CONDITION_LABELS[c]}</span>
                    </button>
                  ))}
                </div>
                {item.condition !== 'good' && item.condition !== 'notApplicable' && (
                  <textarea
                    className={styles.notes}
                    rows={2}
                    placeholder="Describe the issue..."
                    value={item.notes}
                    onChange={e => setNotes(i, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className={styles.bottomBar}>
        {showingSummary ? (
          <>
            <button className={styles.outlineBtn} onClick={prevRoom} type="button">
              <Icon name="arrow-left" size={18} /> Back
            </button>
            <button className={styles.squareBtn} onClick={copyReport} type="button" title="Copy to clipboard" aria-label="Copy to clipboard">
              <Icon name="copy" size={18} />
            </button>
            {typeof navigator.share === 'function' && (
              <button className={`${styles.primaryBtn} ${styles.grow2}`} onClick={shareReport} type="button">
                <Icon name="share" size={18} /> Share Report
              </button>
            )}
          </>
        ) : (
          <>
            {roomIndex > 0 && (
              <button className={styles.outlineBtn} onClick={prevRoom} type="button">
                <Icon name="arrow-left" size={18} /> Back
              </button>
            )}
            <button className={`${styles.primaryBtn} ${roomIndex > 0 ? styles.grow2 : ''}`} onClick={nextRoom} type="button">
              <span className={styles.ellipsis}>
                {isLastRoom ? 'View Summary' : `Next: ${inspection.rooms[roomIndex + 1].roomName}`}
              </span>
              <Icon name="arrow-right" size={18} />
            </button>
          </>
        )}
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionBar} />
      <span>{title}</span>
    </div>
  );
}

function RoomSummaryCard({ room }: { room: RoomInspection }) {
  const issues = roomIssueCount(room);
  const wear = roomWearCount(room);
  const pill =
    issues > 0
      ? { text: `${issues} issue${issues > 1 ? 's' : ''}`, className: styles.pillIssue }
      : wear > 0
        ? { text: `${wear} wear`, className: styles.pillWear }
        : { text: 'All Good', className: styles.pillGood };

  return (
    <div className={`${styles.roomCard} ${issues > 0 ? styles.roomIssue : wear > 0 ? styles.roomWear : ''}`}>
      <div className={styles.roomHead}>
        <span className={styles.roomIcon}>{room.roomIcon}</span>
        <span className={styles.roomName}>{room.roomName}</span>
        <span className={`${styles.pill} ${pill.className}`}>{pill.text}</span>
      </div>
      <div className={styles.roomItems}>
        {room.items.map((item, i) => (
          <span key={`${item.name}-${i}`}>{CONDITION_EMOJI[item.condition]} {item.name}</span>
        ))}
      </div>
    </div>
  );
}
