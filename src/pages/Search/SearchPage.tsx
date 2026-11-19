import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties } from '../../hooks/useProperties';
import { useSavedProperties } from '../../hooks/useSavedProperties';
import { PropertyCard } from '../../components/PropertyCard/PropertyCard';
import type { PropertyFilters } from '../../services/properties';
import styles from './Search.module.css';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') || '';

  const [search, setSearch] = useState(qFromUrl);
  const [type, setType] = useState('');
  const [houseType, setHouseType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<PropertyFilters>({
    search: qFromUrl || undefined,
    country: 'KE',
    size: 40,
  });

  const { isSaved, toggle } = useSavedProperties();

  const filters = useMemo(() => appliedFilters, [appliedFilters]);
  const { properties, isLoading, error } = useProperties(filters);

  const handleApply = () => {
    const f: PropertyFilters = { country: 'KE', size: 40 };
    if (search.trim()) f.search = search.trim();
    if (type) f.type = type;
    if (houseType) f.houseType = houseType;
    if (minPrice) f.minPrice = Number(minPrice);
    if (maxPrice) f.maxPrice = Number(maxPrice);
    if (bedrooms) f.bedrooms = Number(bedrooms);
    setAppliedFilters(f);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Search Properties</h1>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Keyword</label>
          <input
            className={styles.filterInput}
            placeholder="Location, name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <select className={styles.filterSelect} value={type} onChange={e => setType(e.target.value)}>
            <option value="">All</option>
            <option value="RENTAL">Rental</option>
            <option value="SALE">For Sale</option>
            <option value="SHORT_STAY">Short Stay</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>House Type</label>
          <select className={styles.filterSelect} value={houseType} onChange={e => setHouseType(e.target.value)}>
            <option value="">Any</option>
            <option value="BEDSITTER">Bedsitter</option>
            <option value="ONE_BEDROOM">1 Bedroom</option>
            <option value="TWO_BEDROOM">2 Bedroom</option>
            <option value="THREE_BEDROOM">3 Bedroom</option>
            <option value="FOUR_BEDROOM">4 Bedroom</option>
            <option value="STUDIO">Studio</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Min Price</label>
          <input className={styles.filterInput} type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Max Price</label>
          <input className={styles.filterInput} type="number" placeholder="Any" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Bedrooms</label>
          <select className={styles.filterSelect} value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <button className={styles.applyBtn} onClick={handleApply} type="button">
          Search
        </button>
      </div>

      <div className={styles.results}>
        {!isLoading && !error && `${properties.length} properties found`}
      </div>

      {isLoading ? (
        <div className={styles.loading}><div className={styles.spinner} /></div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : properties.length === 0 ? (
        <div className={styles.empty}>No properties match your filters. Try broadening your search.</div>
      ) : (
        <div className={styles.grid}>
          {properties.map(p => (
            <PropertyCard key={p.id} property={p} isSaved={isSaved(p.id)} onToggleSave={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
