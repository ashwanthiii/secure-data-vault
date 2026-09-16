import { useEffect, useState } from 'react';
import { AppShell, ErrorBanner } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api, downloadProtectedFile } from '../lib/api';
import { decryptFile } from '../lib/crypto';
import { formatExpiresAt, formatHistoryDate, formatHistoryDateTime, formatMemberSince, initials } from '../lib/format';

export default function ProfilePage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    api('/profile/received-files')
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message));
  }, []);

  async function downloadItem(item) {
    setError('');
    setBusyId(item.fileId);
    try {
      const downloaded = await downloadProtectedFile(item.fileId);
      const plain = await decryptFile(downloaded.buffer, downloaded.fileKeyB64);
      const blob = new Blob([plain], { type: downloaded.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      const refreshed = await api('/profile/received-files');
      setItems(refreshed.items || []);
    } catch (err) {
      setError(err.message || 'Unable to download this file.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <AppShell activePath="profile">
      <div className="flex flex-col gap-y-space-xl">
        <div className="flex flex-col gap-space-md mb-space-lg">
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Profile</h1>
        </div>
        <ErrorBanner message={error} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-4 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-lg text-headline-lg shadow-md flex-shrink-0">
                  {initials(user.fullName)}
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{user.fullName}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-space-lg pt-space-md border-t border-outline-variant/30 flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">Member since</span>
                <span className="text-on-surface font-semibold">{formatMemberSince(user.createdAt, user.timezone)}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col gap-space-md">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Received Files</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">A history of files you have received and downloaded.</p>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                {items.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">No received files yet.</p>
                ) : (
                  items.map((item) =>
                    item.status === 'active' ? (
                      <div key={item.id} className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[20px]">description</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.filename}</span>
                              <span className="font-body-sm text-body-sm text-on-tertiary-container font-medium">
                                Active (Expires {formatExpiresAt(item.expiresAt, user.timezone)})
                              </span>
                            </div>
                          </div>
                          <button
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all font-body-sm text-body-sm font-medium self-start sm:self-auto active:scale-95 shadow-sm disabled:opacity-70"
                            disabled={busyId === item.fileId}
                            type="button"
                            onClick={() => downloadItem(item)}
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            <span>{busyId === item.fileId ? 'Preparing file...' : 'Download'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-body-sm font-body-sm">
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant text-label-subtext">Received</span>
                            <span className="text-on-surface font-medium">{formatHistoryDate(item.receivedAt, user.timezone)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant text-label-subtext">Downloaded</span>
                            <span className="text-on-surface font-medium">
                              {item.downloadedAt ? formatHistoryDateTime(item.downloadedAt, user.timezone) : 'Not yet'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={item.id} className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-3 opacity-80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[20px]">description</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-body-md text-body-md font-medium text-on-surface truncate">{item.filename}</span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">Expired (Temporary file removed)</span>
                            </div>
                          </div>
                          <span className="text-body-sm font-body-sm text-on-surface-variant font-medium self-start sm:self-auto px-2 py-1">Expired</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-body-sm font-body-sm">
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant text-label-subtext">Received</span>
                            <span className="text-on-surface font-medium">{formatHistoryDate(item.receivedAt, user.timezone)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-on-surface-variant text-label-subtext">Downloaded</span>
                            <span className="text-on-surface font-medium">
                              {item.downloadedAt ? formatHistoryDate(item.downloadedAt, user.timezone) : 'Not downloaded'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
              <p className="mt-space-md text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                Download history remains recorded in your account even after temporary files expire and are deleted from the server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
