import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }) =>
  isActive
    ? 'px-3 py-1.5 rounded-lg transition-colors bg-surface-container-high text-on-surface font-semibold'
    : 'px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors font-body-md text-body-md';

const iconClass = ({ isActive }) =>
  isActive
    ? 'p-2 rounded-lg bg-surface-container-high text-on-surface inline-flex items-center justify-center'
    : 'p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors inline-flex items-center justify-center';

export default function AppHeader({ activePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
      <div className="h-16 max-w-[1200px] mx-auto px-margin flex items-center justify-between">
        <div className="flex items-center gap-space-lg">
          <NavLink to="/" className="flex items-center gap-space-sm">
            <img alt="Secure File Transfer Logo" className="h-8 w-auto object-contain" src="/logo.svg" />
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
              Secure File Transfer
            </span>
          </NavLink>
          <nav className="hidden md:flex items-center gap-space-xs">
            <NavLink className={navClass} end to="/">
              Home
            </NavLink>
            <NavLink className={navClass} to="/send">
              Send File
            </NavLink>
            <NavLink className={navClass} to="/receive">
              Receive File
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-space-sm">
          {user ? (
            <>
              <NavLink className={iconClass} to="/help" title="Help">
                <span className="material-symbols-outlined text-[20px]">help</span>
              </NavLink>
              <NavLink className={iconClass} to="/settings" title="Settings">
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </NavLink>
            </>
          ) : null}
          {user && (activePath === 'receive' || activePath === 'link') ? (
            <button
              className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors inline-flex items-center justify-center"
              onClick={onLogout}
              title="Logout"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          ) : null}
          <div className="h-5 w-[1px] bg-outline-variant/40 mx-1" />
          {user ? (
            <NavLink className="flex items-center" to="/profile" title="Profile">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
            </NavLink>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function AppFooter({ simple = false }) {
  if (simple) {
    return (
      <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest py-space-md">
        <div className="max-w-[1200px] mx-auto px-margin flex items-center justify-center font-label-subtext text-label-subtext text-on-surface-variant text-center">
          <span>© 2025 Secure File Transfer. Simple &amp; secure file sharing.</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-container-lowest py-space-md">
      <div className="max-w-[1200px] mx-auto px-margin flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-subtext text-label-subtext text-on-surface-variant">
        <span>© 2025 Secure File Transfer. All rights reserved.</span>
        <div className="flex items-center gap-space-md">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children, activePath, simpleFooter = false }) {
  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between">
      <AppHeader activePath={activePath} />
      <main className="w-full pt-16 flex-1 bg-background">
        <div className="max-w-[1200px] mx-auto px-margin py-space-xl">
          <div className="flex flex-col w-full">{children}</div>
        </div>
      </main>
      <AppFooter simple={simpleFooter} />
    </div>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-error-container text-on-error-container px-3.5 py-2.5 text-body-sm font-body-sm">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg bg-surface-container-low text-on-tertiary-container px-3.5 py-2.5 text-body-sm font-body-sm">
      {message}
    </div>
  );
}
