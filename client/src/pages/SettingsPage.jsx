import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, ErrorBanner, SuccessBanner } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { browserTimezone, formatTimezoneLabel } from '../lib/format';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const [busy, setBusy] = useState(false);

  async function updatePassword() {
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await api('/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLocationPreference(enabled) {
    setLocationError('');
    const timezone = browserTimezone();
    if (enabled) {
      if (!navigator.geolocation) {
        setLocationError('Location permission denied');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async () => {
          const data = await api('/settings/timezone', {
            method: 'PUT',
            body: JSON.stringify({ timezone, locationPermission: true }),
          });
          setUser(data.user);
        },
        () => setLocationError('Location permission denied')
      );
      return;
    }
    const data = await api('/settings/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone, locationPermission: false }),
    });
    setUser(data.user);
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <AppShell activePath="settings">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-space-lg pb-16">
        <div className="flex flex-col gap-1 pb-2 border-b border-outline-variant/30">
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">Settings</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your password, localization, and account access preferences.</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Change Password</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Update your password regularly to keep your account secure.</p>
              </div>
            </div>
            <ErrorBanner message={error} />
            <SuccessBanner message={success} />
            <div className="flex flex-col gap-space-sm pt-2">
              <div className="flex flex-col gap-1">
                <label className="font-body-sm text-body-sm font-medium text-on-surface" htmlFor="current-password">
                  Current Password
                </label>
                <input
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-sm placeholder:text-outline text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  id="current-password"
                  placeholder="Enter current password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body-sm text-body-sm font-medium text-on-surface" htmlFor="new-password">
                  New Password
                </label>
                <input
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-sm placeholder:text-outline text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  id="new-password"
                  placeholder="Enter new password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-body-sm text-body-sm font-medium text-on-surface" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-sm placeholder:text-outline text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/40"
                  id="confirm-password"
                  placeholder="Re-enter new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body-md text-body-md font-medium transition-colors cursor-pointer active:scale-95 shadow-sm disabled:opacity-70"
                  disabled={busy}
                  type="button"
                  onClick={updatePassword}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Time Zone</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Used to display file expiration times in your local time.</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="font-body-sm text-body-sm font-medium text-on-surface">Your Time Zone</label>
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-md text-body-md">
                <span className="font-medium">{formatTimezoneLabel(user.timezone)}</span>
                <span className="material-symbols-outlined text-outline text-[20px]">public</span>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">location_on</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Location Permission</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Allow location access to automatically detect your local time zone for file expiration.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex flex-col gap-0.5">
                <span className="font-body-md text-body-md font-medium text-on-surface">Location Access</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {user.locationPermission ? `Enabled (${formatTimezoneLabel(user.timezone)})` : 'Off'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={Boolean(user.locationPermission)}
                  className="sr-only peer"
                  type="checkbox"
                  onChange={(event) => saveLocationPreference(event.target.checked)}
                />
                <div className="w-12 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            {locationError ? <p className="font-body-sm text-body-sm text-error">{locationError}</p> : null}
          </div>
          <div className="border-t border-outline-variant/30 p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-low/40">
            <div className="flex flex-col gap-0.5">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Logout</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Sign out of your account on this device.</span>
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-surface-container-lowest hover:bg-error-container/30 text-error border border-outline-variant/40 font-body-md text-body-md font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
              type="button"
              onClick={onLogout}
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
