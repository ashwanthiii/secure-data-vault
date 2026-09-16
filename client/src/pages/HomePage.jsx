import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, ErrorBanner } from '../components/AppShell';
import { useTransfer } from '../context/TransferContext';
import { formatFileSize, MAX_FILE_BYTES } from '../lib/format';

export default function HomePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { selectedFile, setSelectedFile } = useTransfer();
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function chooseFile(file) {
    setError('');
    if (!file) {
      setError('Please choose a file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('This file is too large to send.');
      return;
    }
    setSelectedFile(file);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  return (
    <AppShell activePath="home" simpleFooter>
      <div className="relative w-full flex flex-col items-center justify-center">
        <div className="absolute -top-12 w-[600px] h-[340px] bg-gradient-to-b from-secondary/5 via-surface-container-low/40 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="w-full max-w-[760px] flex flex-col items-center">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl p-space-xl transition-all duration-300 relative overflow-hidden">
            <div className="text-center mb-space-lg">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold mb-space-xs">Send a File</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto">Choose a file to securely share</p>
            </div>
            <div className="mb-space-md">
              <ErrorBanner message={error} />
            </div>
            <input
              className="hidden"
              onChange={(event) => chooseFile(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
            {!selectedFile ? (
              <div
                className={`flex flex-col items-center justify-center p-space-xl rounded-lg bg-surface-container-low transition-all group cursor-pointer ${dragOver ? 'ring-2 ring-secondary' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center mb-space-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[32px] text-secondary">cloud_upload</span>
                </div>
                <p className="font-headline-sm text-headline-sm text-on-surface mb-space-xs text-center font-medium">Drag and drop your file here</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg text-center max-w-xs">Files up to 5 GB supported</p>
                <button
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-medium shadow hover:bg-inverse-surface transition-all flex items-center gap-2"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">folder_open</span>
                  Choose File
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-space-lg">
                <div className="p-space-lg rounded-lg bg-surface-container-low shadow-sm flex flex-col gap-space-md">
                  <div className="p-space-md rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px] text-secondary">description</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">{selectedFile.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                    <button
                      className="shrink-0 p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors flex items-center gap-1 font-body-sm text-body-sm font-medium"
                      title="Remove file"
                      type="button"
                      onClick={() => setSelectedFile(null)}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
                <button
                  className="w-full py-3.5 px-space-lg rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold shadow-md hover:bg-inverse-surface transition-all flex items-center justify-center gap-2 group"
                  type="button"
                  onClick={() => navigate('/send')}
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
          <div className="mt-space-lg flex items-center gap-space-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">check_circle</span>
            <span className="font-body-sm text-body-sm font-medium">Your file is protected and will expire automatically.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
