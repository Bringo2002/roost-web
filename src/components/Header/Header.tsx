import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../Icon/Icon';
import { AccountMenu } from '../AccountMenu/AccountMenu';
import styles from './Header.module.css';

export function Header({ unreadMessages = 0 }: { unreadMessages?: number }) {
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
        <span className={styles.searchIcon}><Icon name="search" size={18} /></span>
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
        <Icon name="chevron-down" size={16} />
      </button>

      <div className={styles.headerActions}>
        <button
          className={styles.iconBtn}
          onClick={() => navigate('/messages')}
          type="button"
          aria-label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : 'Messages'}
        >
          <Icon name="bell" size={18} />
          {unreadMessages > 0 && (
            <span className={styles.iconBadge} aria-hidden="true">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </button>

        {isAuthenticated ? (
          <AccountMenu
            initial={initial}
            name={displayName}
            email={user?.email || tokenUser?.email || ''}
            triggerClassName={styles.avatar}
            unreadMessages={unreadMessages}
          />
        ) : (
          <button
            className={styles.avatar}
            onClick={() => navigate('/login')}
            type="button"
            aria-label="Sign in"
            style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}
          >
            <Icon name="user" size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
