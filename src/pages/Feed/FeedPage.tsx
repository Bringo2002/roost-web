import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../../hooks/useProperties';
import { useSavedProperties } from '../../hooks/useSavedProperties';
import { formatPrice } from '../../utils/format';
import { formatHouseType } from '../../types/property';
import type { Property } from '../../types/property';
import styles from './Feed.module.css';

function FeedCard({ property, isSaved, onToggleSave }: {
  property: Property;
  isSaved: boolean;
  onToggleSave: (id: number) => void;
}) {
  const navigate = useNavigate();
  const imgSrc = property.imageUrls?.[0] || property.imageUrl || '/roost_logo.png';

  return (
    <article className={styles.feedCard}>
      <div className={styles.cardImage} onClick={() => navigate(`/property/${property.id}`)}>
        <img src={imgSrc} alt={property.title} loading="lazy" />
        <div className={styles.imageOverlay}>
          <span className={styles.priceTag}>
            {formatPrice(property.price, property.country)}
            {property.type === 'RENTAL' && <span className={styles.priceUnit}>/mo</span>}
          </span>
          <span className={styles.typeBadge}>
            {property.type === 'RENTAL' ? 'Rental' : property.type === 'SALE' ? 'For Sale' : 'Short Stay'}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitle} onClick={() => navigate(`/property/${property.id}`)}>
          {property.title}
        </div>
        <div className={styles.cardLocation}>
          📍 {property.location}
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>🛏 {formatHouseType(property.houseType)}</span>
          <span className={styles.metaItem}>🚿 {property.bathrooms} Bath</span>
          {property.furnished && <span className={styles.metaItem}>🪑 Furnished</span>}
          {property.verified && (
            <span className={styles.verifiedBadge}>✓ Verified</span>
          )}
        </div>

        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${isSaved ? styles.actionBtnActive : ''}`}
            onClick={() => onToggleSave(property.id)}
            type="button"
          >
            {isSaved ? '♥' : '♡'} {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => navigate(`/messages?to=${property.owner?.id || ''}`)}
            type="button"
          >
            ✉ Message
          </button>
          <span className={styles.actionSpacer} />
          <button
            className={styles.actionBtn}
            onClick={() => navigate(`/property/${property.id}`)}
            type="button"
          >
            View →
          </button>
        </div>
      </div>
    </article>
  );
}

export function FeedPage() {
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const { properties, isLoading } = useProperties({ size: 20 });
  const { isSaved, toggle } = useSavedProperties();

  const shuffled = useCallback(() => {
    return [...properties].sort(() => Math.random() - 0.5);
  }, [properties, shuffleTrigger]);

  const feedProperties = shuffled();

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explore</h1>
        <button
          className={styles.refreshBtn}
          onClick={() => setShuffleTrigger(t => t + 1)}
          type="button"
        >
          ↻ Shuffle
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : (
        feedProperties.map(p => (
          <FeedCard
            key={p.id}
            property={p}
            isSaved={isSaved(p.id)}
            onToggleSave={toggle}
          />
        ))
      )}

      {!isLoading && feedProperties.length > 0 && (
        <div className={styles.endMessage}>
          You've seen all properties. Try shuffling for a fresh order!
        </div>
      )}
    </div>
  );
}
