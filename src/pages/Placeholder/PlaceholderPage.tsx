import styles from './Placeholder.module.css';

interface PlaceholderPageProps {
  icon: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ icon, title, description }: PlaceholderPageProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.icon}>{icon}</span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.desc}>{description}</p>
      <span className={styles.badge}>Coming Soon</span>
    </div>
  );
}
