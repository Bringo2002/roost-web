import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../hooks/useProperties';
import { useSavedProperties } from '../../hooks/useSavedProperties';
import { PropertyCard } from '../../components/PropertyCard/PropertyCard';
import type { PropertyFilters } from '../../services/properties';
import styles from './Home.module.css';

const CATEGORIES = [
  { label: 'All', filter: {} },
  { label: 'Rentals', filter: { type: 'RENTAL' } },
  { label: 'For Sale', filter: { type: 'SALE' } },
  { label: 'Short Stay', filter: { type: 'SHORT_STAY' } },
  { label: 'Bedsitter', filter: { houseType: 'BEDSITTER' } },
  { label: '1 Bedroom', filter: { houseType: 'ONE_BEDROOM' } },
  { label: '2 Bedroom', filter: { houseType: 'TWO_BEDROOM' } },
  { label: '3 Bedroom', filter: { houseType: 'THREE_BEDROOM' } },
  { label: 'Studio', filter: { houseType: 'STUDIO' } },
  { label: 'Furnished', filter: { furnished: true } },
  { label: 'Verified Only', filter: { verified: true } },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user, tokenUser, isAuthenticated } = useAuth();
  const firstName = (user?.name || tokenUser?.name || '').trim().split(/\s+/)[0];
  const [activeCategory, setActiveCategory] = useState(0);
  const filters: PropertyFilters = {
    ...CATEGORIES[activeCategory].filter,
    size: 20,
    country: 'KE',
  };

  const { properties, isLoading, error } = useProperties(filters);
  const { isSaved, toggle } = useSavedProperties();

  return (
    <div className={styles.page}>
      {/* ── Hero ──────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          {isAuthenticated && firstName ? (
            <span className={styles.heroGreeting}>Welcome back, {firstName} 👋</span>
          ) : (
            <span className={styles.heroTag}>✦ Africa's Property Platform</span>
          )}
          <h1 className={styles.heroTitle}>
            Find a place.{' '}
            <span className={styles.heroGold}>Not a middleman.</span>
          </h1>
          <p className={styles.heroDesc}>
            Discover homes around you. Connect directly with the people
            responsible for them.
          </p>
          <div className={styles.heroActions}>
            <button
              className={`${styles.heroBtn} ${styles.heroBtnPrimary}`}
              onClick={() => navigate('/search')}
              type="button"
            >
              Explore Properties
            </button>
            <button
              className={`${styles.heroBtn} ${styles.heroBtnSecondary}`}
              onClick={() => navigate('/hosting/new')}
              type="button"
            >
              List Your Property
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>Verified badges</span>
              <span className={styles.statLabel}>Earned through location and document checks</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Direct contact</span>
              <span className={styles.statLabel}>Chat or call the people responsible</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Fast &amp; easy</span>
              <span className={styles.statLabel}>Filter by type, price and area</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────── */}
      <div className={styles.categories}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            className={`${styles.categoryPill} ${i === activeCategory ? styles.categoryPillActive : ''}`}
            onClick={() => setActiveCategory(i)}
            type="button"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Properties Grid ───────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {CATEGORIES[activeCategory].label === 'All' ? 'Available Near You' : CATEGORIES[activeCategory].label}
          </h2>
          <button className={styles.sectionLink} onClick={() => navigate('/search')} type="button">
            View All →
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : properties.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏠</div>
            <div className={styles.emptyTitle}>No properties found</div>
            <div className={styles.emptyDesc}>
              Try adjusting your filters or check back later for new listings.
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={isSaved(p.id)}
                onToggleSave={toggle}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
