import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, ErrorBanner } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTransfer } from '../context/TransferContext';
import { api } from '../lib/api';
import { encryptFile, generateAccessCode, sha256Hex } from '../lib/crypto';
import { formatExpiresAt, formatFileSize, futureIsoFromMinutes } from '../lib/format';

const DURATIONS = [
  { label: '10 minutes', minutes: 10 },
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '6 hours', minutes: 360 },
  { label: '12 hours', minutes: 720 },
  { label: '24 hours', minutes: 1440 },
  { label: 'Custom', minutes: null, custom: true },
];

export default function SendFilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { selectedFile, setSelectedFile, setLastShare } = useTransfer();
  const [selectedMinutes, setSelectedMinutes] = useState(360);
  const [customHours, setCustomHours] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationNote, setLocationNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!selectedFile) navigate('/', { replace: true });
  }, [selectedFile, navigate]);

  const durationMinutes = useMemo(() => {
    if (!isCustom) return selectedMinutes;
    return Math.max(1, Number(customHours || 0) * 60 + Number(customMinutes || 0));
  }, [isCustom, selectedMinutes, customHours, customMinutes]);

  const expiresLabel = formatExpiresAt(futureIsoFromMinutes(durationMinutes), user?.timezone);

  async function saveTimezone(timezone, locationPermission) {
    const data = await api('/settings/timezone', {
      method: 'PUT',
      body: JSON.stringify({ timezone, locationPermission }),
    });
    setUser(data.user);
  }

  async function allowLocation() {
    setLocationDenied(false);
    setLocationNote('');
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setError('Location permission denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async () => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await saveTimezone(timezone, true);
        setLocationNote('Local time will be used for expiration.');
      },
      () => {
        setLocationDenied(true);
        setError('Location permission denied');
      }
    );
  }

  async function continueWithoutLocation() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await saveTimezone(timezone, false);
    setLocationDenied(false);
    setError('');
    setLocationNote('Using your device time zone.');
  }

  async function onSend() {
    setError('');
    if (!selectedFile) {
      setError('Please choose a file.');
      return;
    }
    setBusy(true);
    try {
      const encrypted = await encryptFile(selectedFile);
      const accessCode = generateAccessCode();
      const form = new FormData();
      form.append('file', encrypted.blob, 'file.bin');
      form.append('originalFilename', selectedFile.name);
      form.append('mimeType', selectedFile.type || 'application/octet-stream');
      form.append('fileSize', String(selectedFile.size));
      form.append('accessCodeHash', await sha256Hex(accessCode));
      form.append('durationMinutes', String(durationMinutes));
      form.append('fileKey', encrypted.fileKeyB64);

      const data = await api('/files/send', { method: 'POST', body: form });
      setLastShare({
        filename: data.file.filename,
        fileSize: data.file.fileSize,
        accessCode,
        expiresAt: data.file.expiresAt,
      });
      setSelectedFile(null);
      navigate('/link');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!selectedFile) return null;

  return (
    <AppShell activePath="send">
      <div className="w-full flex flex-col gap-space-lg">
        <div className="max-w-[680px] mx-auto w-full flex flex-col gap-space-lg">
          <div className="pb-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Send File</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Easily and securely share files with automated expiration.</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-lg">
            <ErrorBanner message={error} />
            <div className="flex flex-col gap-space-xs">
              <label className="font-body-md text-body-md font-semibold text-on-surface">Selected File</label>
              <div className="p-space-md bg-surface-container-low rounded-lg flex items-center justify-between gap-space-md border border-outline-variant/30">
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px]">description</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md text-on-surface font-medium truncate">{selectedFile.name}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
                  title="Change file"
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    navigate('/');
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-surface-container-low px-3.5 py-3 text-body-sm text-on-surface-variant">
              The receiver will not need an account. Share the generated access code privately.
            </div>
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">schedule</span>
                <label className="font-body-md text-body-md font-semibold text-on-surface">How long should the file be available?</label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATIONS.map((item) => {
                  const active = item.custom ? isCustom : !isCustom && selectedMinutes === item.minutes;
                  return (
                    <button
                      key={item.label}
                      className={`py-2 px-3 rounded-lg font-body-md text-body-md font-medium text-center transition-colors ${
                        item.custom ? 'col-span-2' : ''
                      } ${active ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
                      type="button"
                      onClick={() => {
                        if (item.custom) {
                          setIsCustom(true);
                        } else {
                          setIsCustom(false);
                          setSelectedMinutes(item.minutes);
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              {isCustom ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md py-2.5 px-3 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    min="0"
                    type="number"
                    value={customHours}
                    onChange={(event) => setCustomHours(event.target.value)}
                    placeholder="Hours"
                  />
                  <input
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md py-2.5 px-3 rounded-lg border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    min="0"
                    type="number"
                    value={customMinutes}
                    onChange={(event) => setCustomMinutes(event.target.value)}
                    placeholder="Minutes"
                  />
                </div>
              ) : null}
            </div>
            <div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-sm border border-outline-variant/30">
              <div className="flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5">location_on</span>
                <div className="flex-1">
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    Allow location access to set the correct local time for your file expiration.
                  </p>
                  <div className="mt-space-sm flex flex-wrap items-center gap-space-sm">
                    <button
                      className="px-3 py-1.5 bg-primary text-on-primary text-body-sm font-body-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      type="button"
                      onClick={allowLocation}
                    >
                      Allow Location
                    </button>
                    <button
                      className="px-3 py-1.5 bg-surface-container-high text-on-surface text-body-sm font-body-sm font-medium rounded-lg hover:bg-surface-container transition-colors"
                      type="button"
                      onClick={continueWithoutLocation}
                    >
                      Continue Without Location
                    </button>
                  </div>
                  {locationNote ? <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{locationNote}</p> : null}
                  {locationDenied ? <p className="mt-2 font-body-sm text-body-sm text-error">Location permission denied</p> : null}
                </div>
              </div>
              <div className="pt-space-xs border-t border-outline-variant/20 flex items-center justify-between text-body-sm font-body-sm">
                <span className="text-on-surface-variant">File expires:</span>
                <span className="font-semibold text-on-surface">{expiresLabel}</span>
              </div>
            </div>
            <div className="pt-space-xs flex flex-col gap-space-sm">
              <button
                className="w-full bg-primary hover:bg-primary/90 text-on-primary font-body-lg text-body-lg py-3.5 px-6 rounded-lg font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={busy}
                type="button"
                onClick={onSend}
              >
                <span className="material-symbols-outlined text-[20px]">{busy ? 'progress_activity' : 'send'}</span>
                {busy ? 'Preparing file...' : 'Send Securely'}
              </button>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Files are safely delivered and automatically expire after the set duration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
