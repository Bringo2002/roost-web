import { useState } from 'react';
import styles from './Settings.module.css';

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label className={styles.toggle} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={styles.toggleTrack} />
      <span className={styles.toggleThumb} />
    </label>
  );
}

export function SettingsPage() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [currency, setCurrency] = useState('KES');
  const [language, setLanguage] = useState('en');
  const [darkMode, setDarkMode] = useState(true);
  const [compactCards, setCompactCards] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* ── Notifications ──────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Notifications</div>
          <div className={styles.sectionDesc}>Choose how you want to be notified</div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Push Notifications</div>
            <div className={styles.settingHint}>Get notified about new messages and updates</div>
          </div>
          <Toggle id="push" checked={pushNotifications} onChange={setPushNotifications} />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Email Notifications</div>
            <div className={styles.settingHint}>Receive updates and summaries via email</div>
          </div>
          <Toggle id="email" checked={emailNotifications} onChange={setEmailNotifications} />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Message Alerts</div>
            <div className={styles.settingHint}>Notify me when I receive a new message</div>
          </div>
          <Toggle id="messages" checked={messageNotifications} onChange={setMessageNotifications} />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Price Drop Alerts</div>
            <div className={styles.settingHint}>Get notified when saved properties change price</div>
          </div>
          <Toggle id="prices" checked={priceAlerts} onChange={setPriceAlerts} />
        </div>
      </div>

      {/* ── Preferences ────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Preferences</div>
          <div className={styles.sectionDesc}>Customize your Roost experience</div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Currency</div>
            <div className={styles.settingHint}>Display prices in your preferred currency</div>
          </div>
          <select className={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="KES">KES (Kenya)</option>
            <option value="NGN">NGN (Nigeria)</option>
            <option value="ZAR">ZAR (South Africa)</option>
            <option value="GHS">GHS (Ghana)</option>
            <option value="UGX">UGX (Uganda)</option>
            <option value="TZS">TZS (Tanzania)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Language</div>
          </div>
          <select className={styles.select} value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="sw">Kiswahili</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Auto-play Videos</div>
            <div className={styles.settingHint}>Automatically play property video tours</div>
          </div>
          <Toggle id="autoplay" checked={autoPlay} onChange={setAutoPlay} />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Compact Cards</div>
            <div className={styles.settingHint}>Show smaller property cards in search results</div>
          </div>
          <Toggle id="compact" checked={compactCards} onChange={setCompactCards} />
        </div>
      </div>

      {/* ── Appearance ─────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Appearance</div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Dark Mode</div>
            <div className={styles.settingHint}>Use dark theme throughout the app</div>
          </div>
          <Toggle id="dark" checked={darkMode} onChange={setDarkMode} />
        </div>
      </div>

      {/* ── Privacy ────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Privacy</div>
          <div className={styles.sectionDesc}>Manage your data and privacy settings</div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Location Sharing</div>
            <div className={styles.settingHint}>Allow Roost to access your location for nearby properties</div>
          </div>
          <Toggle id="location" checked={locationSharing} onChange={setLocationSharing} />
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Analytics</div>
            <div className={styles.settingHint}>Help us improve by sharing usage data</div>
          </div>
          <Toggle id="analytics" checked={analyticsOptIn} onChange={setAnalyticsOptIn} />
        </div>
      </div>

      {/* ── Danger Zone ────────────────────────────── */}
      <div className={styles.dangerSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Danger Zone</div>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel}>Delete Account</div>
            <div className={styles.settingHint}>Permanently delete your account and all data</div>
          </div>
          <button
            className={styles.dangerBtn}
            style={{ width: 'auto', padding: '0 16px' }}
            onClick={() => window.confirm('Are you sure? This action cannot be undone.')}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <div className={styles.version}>Roost Web v1.0.0</div>
    </div>
  );
}
