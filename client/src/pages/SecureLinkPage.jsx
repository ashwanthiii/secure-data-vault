import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useTransfer } from '../context/TransferContext';
import { formatExpiresAt, formatFileSize } from '../lib/format';

export default function SecureLinkPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastShare } = useTransfer();

  useEffect(() => {
    if (!lastShare) navigate('/', { replace: true });
  }, [lastShare, navigate]);

  if (!lastShare) return null;

  return (
    <AppShell activePath="link">
      <div className="flex flex-col w-full items-center justify-center py-space-sm">
        <div className="w-full max-w-[760px] flex flex-col gap-space-lg">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-space-lg md:p-space-xl flex flex-col gap-space-lg relative overflow-hidden">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 text-on-tertiary-container">
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">File Ready to Share</h1>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant sm:ml-[48px]">Your file has been secured and is ready to send.</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm border border-outline-variant/30">
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/30">
                <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
                  File
                </span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  {lastShare.filename} <span className="text-on-surface-variant text-body-sm font-normal">({formatFileSize(lastShare.fileSize)})</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">schedule</span>
                  Expires
                </span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  {formatExpiresAt(lastShare.expiresAt, user?.timezone)}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 p-space-md">
                <p className="font-body-md text-body-md font-medium text-on-surface">Receiver access code</p>
                <p className="mt-1 font-headline-lg text-headline-lg font-bold text-primary tracking-[0.12em]">{lastShare.accessCode}</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Share this easy-to-read code privately. No receiver account or link is required.</p>
            </div>
            <div className="flex items-center gap-space-sm p-space-sm px-space-md rounded-lg bg-surface-container-low text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">info</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Give the access code to the receiver. They can enter it on the public Receive File page.
              </p>
            </div>
            <div className="pt-space-xs flex justify-center sm:justify-start">
              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-md text-body-md font-medium transition-colors"
                to="/"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Share Another File
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
