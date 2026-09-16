import { useState } from 'react';
import { AppShell, ErrorBanner } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api, downloadProtectedFile } from '../lib/api';
import { decryptFile, normalizeAccessCode, formatAccessCode, sha256Hex } from '../lib/crypto';
import { formatExpiresAt, formatFileSize } from '../lib/format';

const VIEWABLE = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain']);

export default function ReceiveFilePage() {
  const { user } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [guestAccessToken, setGuestAccessToken] = useState('');
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [meta, setMeta] = useState(null);
  const [opening, setOpening] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [readyFile, setReadyFile] = useState(null);

  async function openFile() {
    setError('');
    setExpired(false);
    setReadyFile(null);
    setGuestAccessToken('');
    if (!accessCode.trim()) {
      setError('Enter the access code you received.');
      return;
    }
    setOpening(true);
    try {
      const data = await api('/files/access-code', {
        method: 'POST',
        body: JSON.stringify({ accessCodeHash: await sha256Hex(normalizeAccessCode(accessCode)) }),
      });
      setMeta(data.file);
      setGuestAccessToken(data.guestAccessToken || '');
    } catch (err) {
      setMeta(null);
      if (err.code === 'expired_link' || err.status === 410) {
        setExpired(true);
        setError('This file is no longer available.');
      } else {
        setError(err.message);
      }
    } finally {
      setOpening(false);
    }
  }

  async function prepareFile() {
    if (!meta) return;
    setError('');
    setPreparing(true);
    try {
      const downloaded = await downloadProtectedFile(meta.id, guestAccessToken);
      if (!downloaded.fileKeyB64) {
        throw new Error('Unable to open this file. The file may be invalid or unavailable.');
      }
      const plain = await decryptFile(downloaded.buffer, downloaded.fileKeyB64);
      const blob = new Blob([plain], { type: meta.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setReadyFile({
        url,
        filename: meta.filename,
        mimeType: meta.mimeType,
        viewable: VIEWABLE.has(meta.mimeType),
      });
    } catch (err) {
      setError(err.message || 'Unable to open this file. The file may be invalid or unavailable.');
    } finally {
      setPreparing(false);
    }
  }

  function downloadReady() {
    if (!readyFile) return;
    const anchor = document.createElement('a');
    anchor.href = readyFile.url;
    anchor.download = readyFile.filename;
    anchor.click();
  }

  return (
    <AppShell activePath="receive">
      <div className="relative w-full max-w-[1040px] mx-auto flex flex-col gap-space-xl">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-space-lg">
          <section className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg sm:p-space-xl flex flex-col gap-space-lg">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">Receive a File</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Paste the secure link you received to open the file.</p>
            </div>
            <ErrorBanner message={error && !expired ? error : ''} />
            <form
              className="flex flex-col gap-space-md"
              onSubmit={(event) => {
                event.preventDefault();
                openFile();
              }}
            >
              <div className="flex flex-col sm:flex-row items-stretch gap-space-sm">
                <input
                  className="flex-1 px-4 py-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md shadow-sm focus:bg-surface-container-lowest focus:outline-none transition-all"
                  maxLength="9"
                  placeholder="Enter code, for example ABCD-2345"
                  value={accessCode}
                  onChange={(event) => setAccessCode(formatAccessCode(event.target.value))}
                />
                <button
                  className="px-6 py-3.5 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-semibold hover:bg-primary-container shadow-sm active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-70"
                  disabled={opening}
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  {opening ? 'Opening...' : 'Open File'}
                </button>
              </div>
            </form>
            {meta ? (
              <div className="border-t border-outline-variant/30 pt-space-md flex flex-col gap-space-md">
                <div className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-low">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-secondary shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">description</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold truncate">{meta.filename}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-on-surface-variant font-body-sm text-body-sm">
                      <span>{formatFileSize(meta.fileSize)}</span>
                      <span>
                        From: <strong className="text-on-surface font-medium">{meta.senderEmail}</strong>
                      </span>
                      <span>
                        Expires: <strong className="text-on-surface font-medium">{formatExpiresAt(meta.expiresAt, user?.timezone)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                {preparing ? (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center">Preparing file...</p>
                ) : null}
                {readyFile ? (
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-space-sm">
                    <p className="mr-auto font-body-md text-body-md text-on-surface font-medium">File ready</p>
                    {readyFile.viewable ? (
                      <a
                        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-body-md font-semibold shadow-sm inline-flex items-center justify-center gap-2"
                        href={readyFile.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                        View File
                      </a>
                    ) : null}
                    <button
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-body-md font-semibold shadow-sm active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
                      type="button"
                      onClick={downloadReady}
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      <span>Download</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end">
                    <button
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-body-md font-semibold shadow-sm active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-70"
                      disabled={preparing}
                      type="button"
                      onClick={prepareFile}
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      <span>View / Download</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </section>
          {expired ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-space-md flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex-shrink-0 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline-sm text-body-md font-semibold text-on-surface">File Expired</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">This file is no longer available.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
