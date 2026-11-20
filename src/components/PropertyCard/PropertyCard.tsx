import { useNavigate } from 'react-router-dom';
import type { Property } from '../../types/property';
import { formatHouseType } from '../../types/property';
import { formatPrice } from '../../utils/format';
import styles from './PropertyCard.module.css';
import { Icon } from '../Icon/Icon';

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  onToggleSave?: (id: number) => void;
}

export function PropertyCard({ property, isSaved = false, onToggleSave }: PropertyCardProps) {
  const navigate = useNavigate();
  const p = property;
  const imgSrc = p.imageUrls?.[0] || p.imageUrl;
  const imageCount = p.imageUrls?.length || 0;

  const handleClick = () => navigate(`/property/${p.id}`);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.(p.id);
  };

  return (
    <article
      className={`${styles.card} ${!p.available ? styles.unavailable : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${p.title} - ${formatPrice(p.price, p.country)}`}
      onKeyDown={e => { if (e.key === 'Enter') handleClick(); }}
    >
      <div className={styles.imageWrap}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={p.title}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.noImage}><Icon name="home" size={32} /></div>
        )}

        {!p.available && <div className={styles.unavailableTag}>Taken</div>}

        {p.verified && (
          <div className={styles.verifiedBadge}>
            <span className={styles.verifiedDot} />
            Verified
          </div>
        )}

        <button
          className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
          onClick={handleSave}
          type="button"
          aria-label={isSaved ? 'Remove from saved' : 'Save property'}
        >
          <Icon name="heart" size={16} fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        {imageCount > 1 && (
          <span className={styles.imageCount}>
            <Icon name="camera" size={12} /> {imageCount}
          </span>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.priceRow}>
          <span className={styles.price}>
            {formatPrice(p.price, p.country)}
            {p.type === 'RENTAL' && <span className={styles.period}>/mo</span>}
          </span>
        </div>

        <div className={styles.location}>
          <Icon name="map-pin" size={14} /> {p.location}
        </div>

        <div className={styles.details}>
          <span className={styles.detail}>{formatHouseType(p.houseType)}</span>
          <span className={styles.detail}><Icon name="bed" size={14} /> {p.bedrooms}</span>
          <span className={styles.detail}><Icon name="bath" size={14} /> {p.bathrooms}</span>
        </div>
      </div>
    </article>
  );
}
