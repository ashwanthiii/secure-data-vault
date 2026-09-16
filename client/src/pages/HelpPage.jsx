import { AppShell } from '../components/AppShell';

const STEPS = [
  'Log in to your account.',
  'Choose the file you want to send.',
  "Enter the receiver's email address.",
  'Select how long the file should be available.',
  'Send the file.',
  'Copy the secure link.',
  'Send the link to the receiver.',
  'The receiver logs in and pastes the link.',
  'The receiver can view or download the file.',
  'After the selected time, the temporary file is automatically removed.',
];

export default function HelpPage() {
  return (
    <AppShell activePath="help">
      <div className="max-w-3xl mx-auto w-full py-space-md">
        <div className="text-center mb-space-xl">
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-2">How to use Secure File Transfer</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">A simple guide to sending and receiving files.</p>
        </div>
        <div className="flex flex-col gap-space-sm mb-space-xl">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-space-md p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface flex items-center justify-center font-semibold text-body-sm flex-shrink-0">
                {index + 1}
              </div>
              <p className="font-body-md text-body-md text-on-surface">{step}</p>
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">help</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">What happens after the file expires?</h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            The temporary file is removed and can no longer be downloaded. The transfer history remains visible in the receiver's profile.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
