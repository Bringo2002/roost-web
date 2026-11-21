import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useProperties } from '../../hooks/useProperties';
import type { Property } from '../../types/property';
import { formatPrice, formatPriceCompact } from '../../utils/format';
import { DEFAULT_CENTER, addBaseTiles, userLocationMarker } from '../../utils/map';
import { Icon } from '../../components/Icon/Icon';
import styles from './Map.module.css';

const USER_ZOOM = 14;

type Located = Property & { latitude: number; longitude: number };

/** Every listing that has a location, as price pins on one map. */
export function MapPage() {
  const navigate = useNavigate();
  const { properties, isLoading, error, refetch } = useProperties();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const fittedRef = useRef(false);

  const located = useMemo(
    () =>
      properties.filter(
        (p): p is Located => p.latitude != null && p.longitude != null,
      ),
    [properties],
  );
  const withoutLocation = properties.length - located.length;
  const selected = located.find(p => p.id === selectedId) ?? null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Create the map once ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false }).setView(DEFAULT_CENTER, 12);
    L.control.zoom({ position: 'topright' }).addTo(map);
    addBaseTiles(map);
    pinsRef.current = L.layerGroup().addTo(map);
    map.on('click', () => setSelectedId(null));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      pinsRef.current = null;
      userMarkerRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  // ── Draw the price pins ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const pins = pinsRef.current;
    if (!map || !pins) return;

    pins.clearLayers();
    for (const p of located) {
      const isSelected = p.id === selectedId;
      L.marker([p.latitude, p.longitude], {
        icon: L.divIcon({
          className: styles.pinWrap,
          html: `<span class="${styles.pin} ${isSelected ? styles.pinSelected : ''}">${formatPriceCompact(p.price, p.country)}</span>`,
          iconSize: [0, 0],
        }),
        zIndexOffset: isSelected ? 1000 : 0,
        keyboard: false,
        title: p.title,
      })
        .on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setSelectedId(p.id);
        })
        .addTo(pins);
    }

    // Frame the listings the first time they arrive, not on every selection.
    if (!fittedRef.current && located.length > 0) {
      fittedRef.current = true;
      const bounds = L.latLngBounds(located.map(p => [p.latitude, p.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [64, 64], maxZoom: 15 });
    }
  }, [located, selectedId]);

  // ── Near me ────────────────────────────────────────────────────────────
  const goToMyLocation = () => {
    if (!('geolocation' in navigator)) {
      showToast('Turn on location services to see homes near you.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const map = mapRef.current;
        if (!map) return;
        const { latitude, longitude } = pos.coords;
        userMarkerRef.current?.remove();
        userMarkerRef.current = userLocationMarker(latitude, longitude).addTo(map);
        map.flyTo([latitude, longitude], USER_ZOOM);
      },
      err => {
        showToast(
          err.code === err.PERMISSION_DENIED
            ? "Location access is off for Roost. Allow it in your browser's site settings to see homes near you."
            : 'Turn on location services to see homes near you.',
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const countText =
    located.length === 1 ? '1 home on the map' : `${located.length} homes on the map`;

  return (
    <div className={styles.screen}>
      <div ref={containerRef} className={styles.map} role="application" aria-label="Map of available properties" />

      {isLoading && (
        <div className={styles.overlay}><div className={styles.spinner} /></div>
      )}

      {error && !isLoading && (
        <div className={styles.overlay}>
          <Icon name="map" size={48} className={styles.overlayIcon} />
          <p className={styles.overlayText}>Couldn't load listings. Check your connection and try again.</p>
          <button className={styles.outlineBtn} onClick={refetch} type="button">Retry</button>
        </div>
      )}

      {!isLoading && !error && (
        <div className={styles.countPill} role="status">
          <Icon name="map-pin" size={16} />
          <span>{located.length === 0 ? 'No listings with a location yet' : countText}</span>
          {withoutLocation > 0 && located.length > 0 && (
            <span className={styles.countNote}>· {withoutLocation} without a location</span>
          )}
        </div>
      )}

      <button
        className={styles.locateBtn}
        onClick={goToMyLocation}
        type="button"
        aria-label="Show homes near my location"
      >
        <Icon name="locate" size={20} />
      </button>

      {selected && (
        <div className={styles.card}>
          <button className={styles.cardMain} onClick={() => navigate(`/property/${selected.id}`)} type="button">
            {(selected.imageUrl || selected.imageUrls?.[0]) ? (
              <img className={styles.thumb} src={selected.imageUrl || selected.imageUrls[0]} alt="" />
            ) : (
              <span className={styles.thumb} />
            )}
            <span className={styles.cardText}>
              <span className={styles.cardTitle}>{selected.title}</span>
              <span className={styles.cardLocation}>{selected.location}</span>
              <span className={styles.cardPrice}>
                {formatPrice(selected.price, selected.country)}
                {selected.type === 'RENTAL' && <span className={styles.period}>/mo</span>}
              </span>
              <span className={styles.cardSpecs}>
                <Icon name="bed" size={14} /> {selected.bedrooms}
                <Icon name="bath" size={14} /> {selected.bathrooms}
              </span>
            </span>
          </button>
          <Link
            className={styles.fullMapBtn}
            to={`/property/${selected.id}/map`}
            aria-label="Open full-screen map for this property"
          >
            <Icon name="navigation" size={18} />
          </Link>
        </div>
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
