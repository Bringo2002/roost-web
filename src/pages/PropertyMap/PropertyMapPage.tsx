import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getPropertyById } from '../../services/properties';
import type { Property } from '../../types/property';
import { distanceKm, formatPrice } from '../../utils/format';
import { DEFAULT_CENTER, addBaseTiles, userLocationMarker } from '../../utils/map';
import { Icon } from '../../components/Icon/Icon';
import styles from './PropertyMap.module.css';

const PROPERTY_ZOOM = 15;
const USER_ZOOM = 14;
const NEIGHBOURHOOD_RADIUS_M = 400;
const MAP_LOAD_TIMEOUT_MS = 10_000;

type Coords = { lat: number; lng: number };

/**
 * Full-screen map for a single property: pin, 400 m neighbourhood ring,
 * distance from the viewer, directions and a call button.
 */
export function PropertyMapPage() {
  const { id } = useParams();
  const propertyId = Number(id);
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapTimedOut, setMapTimedOut] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [userPos, setUserPos] = useState<Coords | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Load the property ──────────────────────────────────────────────────
  const loadProperty = useCallback(async () => {
    setLoadError(false);
    try {
      setProperty(await getPropertyById(propertyId));
    } catch {
      setLoadError(true);
    }
  }, [propertyId]);

  useEffect(() => {
    if (Number.isNaN(propertyId)) {
      setLoadError(true);
      return;
    }
    loadProperty();
  }, [propertyId, loadProperty]);

  const hasCoords = property?.latitude != null && property?.longitude != null;
  const center: [number, number] =
    hasCoords && property ? [property.latitude as number, property.longitude as number] : DEFAULT_CENTER;

  // ── Build the map ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!property || !containerRef.current) return;

    setMapReady(false);
    setMapTimedOut(false);

    const map = L.map(containerRef.current, { zoomControl: false }).setView(center, PROPERTY_ZOOM);
    L.control.zoom({ position: 'topright' }).addTo(map);

    addBaseTiles(map).once('load', () => setMapReady(true));

    if (hasCoords) {
      L.circle(center, {
        radius: NEIGHBOURHOOD_RADIUS_M,
        color: '#FFD700',
        opacity: 0.6,
        weight: 2,
        fillColor: '#FFD700',
        fillOpacity: 0.12,
      }).addTo(map);
      L.marker(center, {
        icon: L.divIcon({
          className: styles.pinWrap,
          html: `<span class="${styles.pin}"></span>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
        keyboard: false,
      }).addTo(map);
    }

    mapRef.current = map;
    const timer = setTimeout(() => setMapTimedOut(true), MAP_LOAD_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
    };
    // The property's coordinates define the map; rebuild only when they change or on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id, property?.latitude, property?.longitude, mapAttempt]);

  // ── Viewer location ────────────────────────────────────────────────────
  const requestLocation = useCallback((recenter: boolean) => {
    if (!('geolocation' in navigator)) {
      showToast('Turn on location services to see your distance from this property.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        if (recenter) mapRef.current?.flyTo([coords.lat, coords.lng], USER_ZOOM);
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          showToast(
            "Location access is off for Roost. Allow it in your browser's site settings to see your distance from this property.",
          );
        } else {
          showToast('Turn on location services to see your distance from this property.');
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [showToast]);

  // Like the app, ask once when the map opens.
  useEffect(() => {
    if (property) requestLocation(false);
  }, [property, requestLocation]);

  // Show the viewer's position on the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;
    userMarkerRef.current?.remove();
    userMarkerRef.current = userLocationMarker(userPos.lat, userPos.lng).addTo(map);
  }, [userPos, mapAttempt, property]);

  const handleLocationButton = () => {
    if (userPos) mapRef.current?.flyTo([userPos.lat, userPos.lng], USER_ZOOM);
    else requestLocation(true);
  };

  const retryMap = () => {
    setMapReady(false);
    setMapTimedOut(false);
    setMapAttempt(n => n + 1);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className={styles.screen}>
        <div className={styles.overlay}>
          <p className={styles.overlayText}>Map couldn't load. Check your connection and try again.</p>
          <div className={styles.overlayActions}>
            <button className={styles.outlineBtn} onClick={() => navigate(-1)} type="button">Back</button>
            <button className={styles.outlineBtn} onClick={loadProperty} type="button">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={styles.screen}>
        <div className={styles.overlay}><div className={styles.spinner} /></div>
      </div>
    );
  }

  const distanceText =
    userPos && hasCoords
      ? `${distanceKm(userPos.lat, userPos.lng, center[0], center[1]).toFixed(1)} km away`
      : property.location;
  const image = property.imageUrl || property.imageUrls?.[0];

  return (
    <div className={styles.screen}>
      <div
        ref={containerRef}
        className={styles.map}
        role="application"
        aria-label={`Map showing ${property.title} and nearby facilities`}
      />

      {!mapReady && (
        <div className={styles.overlay}>
          {mapTimedOut ? (
            <>
              <Icon name="map" size={48} className={styles.overlayIcon} />
              <p className={styles.overlayText}>Map couldn't load. Check your connection and try again.</p>
              <button className={styles.outlineBtn} onClick={retryMap} type="button">Retry</button>
            </>
          ) : (
            <div className={styles.spinner} />
          )}
        </div>
      )}

      <div className={styles.topBar}>
        <button className={styles.circleBtn} onClick={() => navigate(-1)} type="button" aria-label="Back">
          <Icon name="arrow-left" size={20} />
        </button>
        <div className={styles.distancePill}>
          <Icon name="map-pin" size={16} />
          <span>{distanceText}</span>
        </div>
      </div>

      <div className={styles.sideButtons}>
        {hasCoords && (
          <button
            className={styles.circleBtn}
            onClick={() => mapRef.current?.flyTo(center, PROPERTY_ZOOM)}
            type="button"
            aria-label="Center map on property"
          >
            <Icon name="home" size={20} />
          </button>
        )}
        <button
          className={styles.circleBtn}
          onClick={handleLocationButton}
          type="button"
          aria-label={userPos ? 'Center map on your location' : 'Location unavailable. Tap to enable.'}
        >
          <Icon name={userPos ? 'locate' : 'locate-off'} size={20} />
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          {image && <img className={styles.thumb} src={image} alt="" />}
          <div className={styles.cardText}>
            <div className={styles.cardTitle}>{property.title}</div>
            <div className={styles.cardLocation}>{property.location}</div>
            <div className={styles.cardPrice}>
              {formatPrice(property.price, property.country)}
              {property.type === 'RENTAL' && <span className={styles.period}>/mo</span>}
            </div>
          </div>
        </div>
        <div className={styles.cardActions}>
          {hasCoords && (
            <a
              className={styles.navBtn}
              href={`https://www.google.com/maps/dir/?api=1&destination=${center[0]},${center[1]}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="navigation" size={18} />
              Start Navigation
            </a>
          )}
          {property.landlordPhone && (
            <a className={styles.callBtn} href={`tel:${property.landlordPhone}`} aria-label="Call landlord">
              <Icon name="phone" size={20} />
            </a>
          )}
        </div>
      </div>

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
