import { NavLink, useNavigate } from 'react-router-dom';
import styles from './MobileNav.module.css';

export function MobileNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const navigate = useNavigate();

  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      <div className={styles.navList}>
        <NavLink to="/" end className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>
          <span className={styles.navIcon}>⌂</span>
          Home
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>
          <span className={styles.navIcon}>⌕</span>
          Search
        </NavLink>
        <button className={styles.addBtn} onClick={() => navigate('/hosting/new')} type="button" aria-label="List a property">
          +
        </button>
        <NavLink to="/messages" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>
          <span className={styles.navIcon}>✉</span>
          Messages
          {unreadMessages > 0 && (
            <span className={styles.navBadge} aria-label={`${unreadMessages} unread messages`}>
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </span>
          )}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}>
          <span className={styles.navIcon}>☺</span>
          Profile
        </NavLink>
      </div>
    </nav>
  );
}
