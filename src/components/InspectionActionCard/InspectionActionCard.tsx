import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './InspectionActionCard.module.css';

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'camera', label: 'Photo Evidence' },
  { icon: 'gauge', label: 'Meter Readings' },
  { icon: 'pen-line', label: 'Digital Sign-off' },
  { icon: 'share', label: 'Shareable Report' },
];

/** Entry point to the move-in inspection wizard (resumes an in-progress one automatically). */
export function InspectionActionCard({ propertyId }: { propertyId: number }) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.icon}>
          <Icon name="list-checks" size={18} />
        </span>
        <div>
          <h2 className={styles.title}>Move-in Inspection</h2>
          <p className={styles.subtitle}>Digital deposit protection report</p>
        </div>
      </div>

      <p className={styles.body}>
        Protect your deposit with a room-by-room condition report. Document walls, plumbing,
        appliances, and meter readings with photo evidence before you move in.
      </p>

      <div className={styles.pills}>
        {FEATURES.map(f => (
          <span key={f.label} className={styles.pill}>
            <Icon name={f.icon} size={14} />
            {f.label}
          </span>
        ))}
      </div>

      <Link className={styles.cta} to={`/property/${propertyId}/inspection`}>
        <Icon name="play" size={18} />
        Start Inspection
      </Link>
    </div>
  );
}
