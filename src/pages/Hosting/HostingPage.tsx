import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyListings, toggleAvailability, deleteProperty } from '../../services/properties';
import { formatPrice } from '../../utils/format';
import type { Property } from '../../types/property';
import styles from './Hosting.module.css';

const FILTERS = ['ALL', 'ACTIVE', 'TAKEN', 'DRAFT', 'HIDDEN'] as const;

function getStatusClass(status: string): string {
  switch (status) {
    case 'PUBLISHED': return styles.badgePublished;
    case 'DRAFT': return styles.badgeDraft;
    case 'TAKEN': return styles.badgeTaken;
    case 'HIDDEN': return styles.badgeHidden;
    case 'PENDING_REVIEW': return styles.badgeDraft;
    default: return styles.badgeDraft;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PUBLISHED': return 'Active';
    case 'DRAFT': return 'Draft';
    case 'TAKEN': return 'Taken';
    case 'HIDDEN': return 'Hidden';
    case 'PENDING_REVIEW': return 'In Review';
    default: return status;
  }
}

export function HostingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState<Property[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyListings(page, 20, filter);
      setListings(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const activeCount = listings.filter(l => l.status === 'PUBLISHED').length;
  const takenCount = listings.filter(l => l.status === 'TAKEN').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.viewCount || 0), 0);

  const handleToggle = async (p: Property) => {
    try {
      await toggleAvailability(p.id, !p.available);
      fetchListings();
    } catch { /* silent */ }
  };

  const handleDelete = async (p: Property) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await deleteProperty(p.id);
      fetchListings();
    } catch { /* silent */ }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Hosting Dashboard</h1>
          <p className={styles.subtitle}>Manage your property listings</p>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => navigate('/hosting/new')}
          type="button"
        >
          + Add Listing
        </button>
      </div>

      {/* ── Stats Cards ─────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🏠</span>
          <span className={styles.statValue}>{totalElements}</span>
          <span className={styles.statLabel}>Total Listings</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>✓</span>
          <span className={styles.statValue}>{activeCount}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔑</span>
          <span className={styles.statValue}>{takenCount}</span>
          <span className={styles.statLabel}>Taken</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👁</span>
          <span className={styles.statValue}>{totalViews.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Views</span>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────── */}
      <div className={styles.filterTabs}>
        {FILTERS.map(f => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
            onClick={() => { setFilter(f); setPage(0); }}
            type="button"
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* ── Listings ────────────────────────────────── */}
      {loading ? (
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
        </div>
      ) : listings.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🏡</span>
          <span className={styles.emptyTitle}>No listings yet</span>
          <span className={styles.emptyDesc}>
            Start by listing your first property and reach verified tenants.
          </span>
          <button
            className={styles.addBtn}
            onClick={() => navigate('/hosting/new')}
            type="button"
          >
            + Create Your First Listing
          </button>
        </div>
      ) : (
        <div className={styles.listingsList}>
          {listings.map(p => (
            <div key={p.id} className={styles.listingCard}>
              <img
                src={p.imageUrls?.[0] || p.imageUrl || '/roost_logo.png'}
                alt={p.title}
                className={styles.thumbnail}
              />
              <div className={styles.listingDetails}>
                <div className={styles.listingTitle}>{p.title}</div>
                <div className={styles.listingLocation}>{p.location}</div>
                <div className={styles.listingPrice}>
                  {formatPrice(p.price, p.country)}
                  {p.type === 'RENTAL' && '/mo'}
                </div>
              </div>
              <span className={`${styles.badge} ${getStatusClass(p.status)}`}>
                {getStatusLabel(p.status)}
              </span>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleToggle(p)}
                  type="button"
                  title={p.available ? 'Mark as unavailable' : 'Mark as available'}
                >
                  {p.available ? '⏸' : '▶'}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(p)}
                  type="button"
                  title="Delete listing"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            type="button"
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            type="button"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default HostingPage;
