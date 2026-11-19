import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isAuthenticated, tokenUser } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = user?.name || tokenUser?.name || '';
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <header className={styles.header}>
      <form className={styles.searchWrap} onSubmit={handleSearch}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search for houses, apartments, or locations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search properties"
        />
      </form>

      <div className={styles.spacer} />

      <button className={styles.locationBtn} type="button" aria-label="Select location">
        <span className={styles.locationDot} />
        Nairobi
        <span>▾</span>
      </button>

      <div className={styles.headerActions}>
        <button className={styles.iconBtn} type="button" aria-label="Notifications">
          🔔
        </button>

        {isAuthenticated ? (
          <button
            className={styles.avatar}
            onClick={() => navigate('/profile')}
            type="button"
            aria-label="Profile"
          >
            {initial}
          </button>
        ) : (
          <button
            className={styles.avatar}
            onClick={() => navigate('/login')}
            type="button"
            aria-label="Sign in"
            style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            ☺
          </button>
        )}
      </div>
    </header>
  );
}
