import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyInspections } from '../../services/inspections';
import type { MoveInInspection } from '../../types/inspection';
import { generateInspectionReport } from '../../utils/inspectionReport';
import { formatShortDate } from '../../utils/format';
import { Icon } from '../../components/Icon/Icon';
import { Modal } from '../../components/Modal/Modal';
import styles from './Inspections.module.css';

/**
 * A tenant's own move-in inspections, most recent first (the API orders them).
 * Completed ones open a shareable report; in-progress ones go back to the
 * property, where the inspection is resumed.
 */
export function MyInspectionsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<MoveInInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<MoveInInspection | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInspections(await getMyInspections());
    } catch {
      setError("Couldn't load your inspections. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const report = useMemo(
    () => (reportFor ? generateInspectionReport(reportFor) : ''),
    [reportFor],
  );

  const closeReport = useCallback(() => {
    setReportFor(null);
    setCopied(false);
  }, []);

  const open = (inspection: MoveInInspection) => {
    if (inspection.completedAt !== null) {
      setReportFor(inspection);
    } else {
      navigate(`/property/${inspection.propertyId}`);
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareReport = async () => {
    if (!reportFor) return;
    try {
      await navigator.share({
        title: `Move-in Inspection Report — ${reportFor.propertyTitle}`,
        text: report,
      });
    } catch {
      /* the person dismissed the share sheet */
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Inspections</h1>

      {loading ? (
        <div className={styles.center}><div className={styles.spinner} /></div>
      ) : error ? (
        <div className={styles.center}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.outlineBtn} onClick={load} type="button">Retry</button>
        </div>
      ) : inspections.length === 0 ? (
        <div className={styles.center}>
          <Icon name="clipboard-check" size={56} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No move-in inspections yet</p>
          <p className={styles.emptyDesc}>Start one from any property's detail page</p>
        </div>
      ) : (
        <div className={styles.list}>
          {inspections.map(inspection => {
            const completed = inspection.completedAt !== null;
            return (
              <button
                key={inspection.id}
                className={styles.card}
                onClick={() => open(inspection)}
                type="button"
              >
                <span className={styles.cardIcon}>
                  <Icon name={completed ? 'file-check' : 'clock'} size={18} />
                </span>
                <span className={styles.cardText}>
                  <span className={styles.cardTitle}>{inspection.propertyTitle}</span>
                  <span className={styles.cardMeta}>
                    {completed
                      ? `Completed ${formatShortDate(inspection.completedAt as string)}`
                      : `In progress · started ${formatShortDate(inspection.createdAt)}`}
                  </span>
                </span>
                <Icon name="chevron-right" size={20} className={styles.chevron} />
              </button>
            );
          })}
        </div>
      )}

      {reportFor && (
        <Modal
          title={reportFor.propertyTitle}
          onClose={closeReport}
          footer={
            <>
              <button className={styles.outlineBtn} onClick={copyReport} type="button">
                <Icon name="copy" size={16} /> {copied ? 'Copied' : 'Copy'}
              </button>
              {typeof navigator.share === 'function' && (
                <button className={styles.primaryBtn} onClick={shareReport} type="button">
                  <Icon name="share" size={16} /> Share
                </button>
              )}
            </>
          }
        >
          <pre className={styles.report}>{report}</pre>
        </Modal>
      )}
    </div>
  );
}
