import { NavLink, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Sidebar.module.css';

const NAV_ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/search', label: 'Search', icon: 'search' },
  { path: '/map', label: 'Map', icon: 'map' },
  { path: '/feed', label: 'Explore Feed', icon: 'play' },
  { path: '/saved', label: 'Saved', icon: 'heart' },
  { path: '/messages', label: 'Messages', icon: 'message' },
  { path: '/inspections', label: 'My Inspections', icon: 'clipboard-check' },
  { path: '/hosting', label: 'Hosting Dashboard', icon: 'dashboard' },
  { path: '/profile', label: 'Profile', icon: 'user' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const navigate = useNavigate();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/roost_logo.png" alt="Roost" className={styles.logoImg} />
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>Roost</span>
          <span className={styles.logoSubtitle}>Find. Connect. Move.</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}><Icon name={item.icon} size={18} /></span>
            {item.label}
            {item.path === '/messages' && unreadMessages > 0 && (
              <span className={styles.navBadge} aria-label={`${unreadMessages} unread messages`}>
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.listCta}>
        <div className={styles.listCtaTitle}>List Your Property</div>
        <div className={styles.listCtaDesc}>Reach verified tenants in your area.</div>
        <button
          className={styles.listCtaBtn}
          onClick={() => navigate('/hosting/new')}
          type="button"
        >
          Get Started →
        </button>
      </div>
    </aside>
  );
}
