import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountMenu.module.css';

const MENU_ITEMS = [
  { to: '/profile', label: 'Profile', icon: '☺' },
  { to: '/hosting', label: 'My Properties', icon: '⌂' },
  { to: '/saved', label: 'Saved Properties', icon: '♡' },
  { to: '/inspections', label: 'My Inspections', icon: '☑' },
  { to: '/messages', label: 'Messages', icon: '✉' },
  { to: '/settings', label: 'Account Settings', icon: '⚙' },
];

interface AccountMenuProps {
  initial: string;
  name: string;
  email: string;
  triggerClassName: string;
  unreadMessages?: number;
}

export function AccountMenu({ initial, name, email, triggerClassName, unreadMessages = 0 }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        className={triggerClassName}
        onClick={() => setOpen(o => !o)}
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.identity}>
            <div className={styles.identityAvatar}>{initial}</div>
            <div className={styles.identityText}>
              <div className={styles.identityName}>{name || 'Your account'}</div>
              {email && <div className={styles.identityEmail}>{email}</div>}
            </div>
          </div>

          <nav className={styles.items}>
            {MENU_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className={styles.itemIcon}>{item.icon}</span>
                {item.label}
                {item.to === '/messages' && unreadMessages > 0 && (
                  <span className={styles.badge} aria-label={`${unreadMessages} unread messages`}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button className={styles.logout} onClick={handleLogout} type="button" role="menuitem">
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
