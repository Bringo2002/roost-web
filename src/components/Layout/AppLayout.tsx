import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { MobileNav } from '../MobileNav/MobileNav';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const unreadMessages = useUnreadCount();

  return (
    <div className={styles.layout}>
      <Sidebar unreadMessages={unreadMessages} />
      <Header unreadMessages={unreadMessages} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
}
