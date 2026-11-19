import { useSavedProperties } from '../../hooks/useSavedProperties';
import { PropertyCard } from '../../components/PropertyCard/PropertyCard';
import styles from '../Home/Home.module.css';

export function SavedPage() {
  const { savedProperties, isLoading, isSaved, toggle } = useSavedProperties();

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h1 className={styles.sectionTitle}>Saved Properties</h1>
        </div>

        {isLoading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : savedProperties.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>♡</div>
            <div className={styles.emptyTitle}>No saved properties yet</div>
            <div className={styles.emptyDesc}>
              Tap the heart icon on any listing to save it here for later.
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {savedProperties.map(p => (
              <PropertyCard key={p.id} property={p} isSaved={isSaved(p.id)} onToggleSave={toggle} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
