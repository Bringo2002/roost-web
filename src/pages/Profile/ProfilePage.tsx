import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, changePassword, becomeLister } from '../../services/users';
import styles from './Profile.module.css';

export function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Edit Profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Become a Lister state
  const [listerSuccess, setListerSuccess] = useState('');
  const [listerError, setListerError] = useState('');
  const [isBecomingLister, setIsBecomingLister] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Sync profile fields with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsUpdatingProfile(true);

    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      await refreshUser();
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (result.success) {
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.error || 'Failed to change password.');
    }
  };

  const handleBecomeLister = async () => {
    setListerError('');
    setListerSuccess('');
    setIsBecomingLister(true);

    try {
      await becomeLister();
      await refreshUser();
      setListerSuccess('Congratulations! You are now registered as a lister.');
    } catch (err) {
      setListerError(err instanceof Error ? err.message : 'Failed to register as a lister.');
    } finally {
      setIsBecomingLister(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Loading state while user is null
  if (isLoading || !user) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const userInitial = user.name?.trim()
    ? user.name.trim().charAt(0).toUpperCase()
    : user.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <div className={styles.page}>
      {/* ── Profile Header Card ── */}
      <div className={styles.headerCard}>
        <div className={styles.avatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{user.name || 'Anonymous User'}</h1>
          <p className={styles.email}>{user.email}</p>
          <span className={styles.roleBadge}>{user.role || 'TENANT'}</span>
        </div>
      </div>

      {/* ── Edit Profile Section ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Edit Profile</h2>
        <form className={styles.form} onSubmit={handleUpdateProfile}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              className={styles.input}
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isUpdatingProfile}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="profile-phone">Phone Number</label>
            <input
              id="profile-phone"
              className={styles.input}
              type="tel"
              placeholder="+254 700 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isUpdatingProfile}
            />
          </div>

          {profileSuccess && <div className={styles.successMessage}>{profileSuccess}</div>}
          {profileError && <div className={styles.errorMessage}>{profileError}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Change Password Section ── */}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Change Password</h2>
        <form className={styles.form} onSubmit={handleChangePassword}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              disabled={isChangingPassword}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={isChangingPassword}
            />
          </div>

          {passwordSuccess && <div className={styles.successMessage}>{passwordSuccess}</div>}
          {passwordError && <div className={styles.errorMessage}>{passwordError}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── Become a Lister Section ── */}
      {user?.role !== 'LANDLORD' && (
        <div className={styles.listerCard}>
          <h2 className={styles.listerTitle}>Become a Lister</h2>
          <p className={styles.listerDesc}>
            List your properties and reach thousands of verified tenants
          </p>
          {listerSuccess && <div className={styles.successMessage}>{listerSuccess}</div>}
          {listerError && <div className={styles.errorMessage}>{listerError}</div>}
          <button
            type="button"
            className={styles.listerBtn}
            onClick={handleBecomeLister}
            disabled={isBecomingLister}
          >
            {isBecomingLister ? 'Processing...' : 'Become a Lister'}
          </button>
        </div>
      )}

      {/* ── Logout Section ── */}
      <button
        type="button"
        className={styles.logoutBtn}
        onClick={handleLogout}
      >
        Log Out
      </button>
    </div>
  );
}

export default ProfilePage;
