import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPropertyById, getSimilarProperties, recordView } from '../../services/properties';
import { useSavedProperties } from '../../hooks/useSavedProperties';
import { PropertyCard } from '../../components/PropertyCard/PropertyCard';
import { InspectionActionCard } from '../../components/InspectionActionCard/InspectionActionCard';
import { getActiveAmenities, getManagementBadge, formatHouseType, getTotalMoveInCost } from '../../types/property';
import type { Property } from '../../types/property';
import { formatPrice } from '../../utils/format';
import styles from './PropertyDetail.module.css';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const { isSaved, toggle } = useSavedProperties();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    const pid = Number(id);

    getPropertyById(pid)
      .then(p => {
        setProperty(p);
        recordView(pid).catch(() => {});
        return getSimilarProperties(pid);
      })
      .then(s => setSimilar(s))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load property'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error || !property) return <div className={styles.error}>{error || 'Property not found'}</div>;

  const p = property;
  const images = p.imageUrls?.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []);
  const amenities = getActiveAmenities(p);
  const totalCost = getTotalMoveInCost(p);

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} type="button">
        ← Back
      </button>

      {/* Gallery */}
      {images.length > 0 && (
        <div className={styles.gallery}>
          <img src={images[imageIndex]} alt={`${p.title} ${imageIndex + 1}`} className={styles.galleryImg} />
          {images.length > 1 && (
            <>
              <button
                className={`${styles.galleryNav} ${styles.galleryPrev}`}
                onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)}
                type="button"
              >‹</button>
              <button
                className={`${styles.galleryNav} ${styles.galleryNext}`}
                onClick={() => setImageIndex(i => (i + 1) % images.length)}
                type="button"
              >›</button>
              <span className={styles.galleryCounter}>{imageIndex + 1} / {images.length}</span>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{p.title}</h1>
          <div className={styles.location}>📍 {p.location}</div>
          <div className={styles.badges}>
            {p.verified && <span className={`${styles.badge} ${styles.badgeVerified}`}>✓ Verified</span>}
            <span className={`${styles.badge} ${styles.badgeType}`}>{formatHouseType(p.houseType)}</span>
            <span className={`${styles.badge} ${styles.badgeManager}`}>{getManagementBadge(p)}</span>
          </div>
        </div>
        <div className={styles.priceBox}>
          <div className={styles.price}>{formatPrice(p.price, p.country)}</div>
          {p.type === 'RENTAL' && <div className={styles.pricePeriod}>per month</div>}
          <button className={styles.contactBtn} type="button" onClick={() => navigate(`/messages?to=${p.owner?.id || ''}`)}>
            💬 Contact {p.landlordName || 'Owner'}
          </button>
          <button
            className={styles.saveBtn}
            type="button"
            onClick={() => toggle(p.id)}
          >
            {isSaved(p.id) ? '♥ Saved' : '♡ Save'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Description</h2>
        <div className={styles.descText}>{p.description}</div>
      </div>

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Amenities</h2>
          <div className={styles.amenitiesGrid}>
            {amenities.map(a => <span key={a} className={styles.amenity}>{a}</span>)}
          </div>
        </div>
      )}

      {/* Move-in Costs */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Move-in Costs</h2>
        <div className={styles.costGrid}>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Monthly Rent</span>
            <span className={styles.costValue}>{formatPrice(p.price, p.country)}</span>
          </div>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Deposit ({p.depositMonths}mo)</span>
            <span className={styles.costValue}>{formatPrice(p.price * p.depositMonths, p.country)}</span>
          </div>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Water Fee</span>
            <span className={styles.costValue}>{formatPrice(p.waterFee, p.country)}</span>
          </div>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Garbage Fee</span>
            <span className={styles.costValue}>{formatPrice(p.garbageFee, p.country)}</span>
          </div>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Service Charge</span>
            <span className={styles.costValue}>{formatPrice(p.serviceCharge, p.country)}</span>
          </div>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Total Move-in</span>
            <span className={styles.costValue} style={{ color: 'var(--color-gold)' }}>{formatPrice(totalCost, p.country)}</span>
          </div>
        </div>
      </div>

      <InspectionActionCard propertyId={p.id} />

      {/* Similar Properties */}
      {similar.length > 0 && (
        <div className={styles.similarSection}>
          <h2 className={styles.sectionTitle}>Similar Properties</h2>
          <div className={styles.similarGrid}>
            {similar.slice(0, 4).map(sp => (
              <PropertyCard key={sp.id} property={sp} isSaved={isSaved(sp.id)} onToggleSave={toggle} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
