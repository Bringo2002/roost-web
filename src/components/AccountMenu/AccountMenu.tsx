import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './AccountMenu.module.css';

const MENU_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/profile', label: 'Profile', icon: 'user' },
  { to: '/hosting', label: 'My Properties', icon: 'home' },
  { to: '/saved', label: 'Saved Properties', icon: 'heart' },
  { to: '/inspections', label: 'My Inspections', icon: 'clipboard-check' },
  { to: '/messages', label: 'Messages', icon: 'message' },
  { to: '/settings', label: 'Account Settings', icon: 'settings' },
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
                <span className={styles.itemIcon}><Icon name={item.icon} size={18} /></span>
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
