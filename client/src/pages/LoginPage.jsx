import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const search = new URLSearchParams(location.search);
  const presetEmail = String(search.get('email') || '').trim().toLowerCase();
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.registered ? 'Account created. Please log in.' : '');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      const next = new URLSearchParams(location.search).get('next') || '/';
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900 antialiased font-sans">
      <header className="w-full py-6 px-8 flex justify-center sm:justify-start max-w-7xl mx-auto">
        <Link className="flex items-center space-x-3 group" to="/login" title="Secure File Transfer">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" fill="currentColor" r="1.5" />
            </svg>
          </div>
          <span className="font-semibold text-lg text-slate-900 tracking-tight">Secure File Transfer</span>
        </Link>
      </header>
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mb-4 border border-sky-100/80 shadow-inner">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Log In</h1>
                <p className="mt-2 text-sm text-slate-500">Sign in to access your secure transfers.</p>
              </div>
              <form className="space-y-5" onSubmit={onSubmit}>
                {info ? <div className="rounded-lg bg-sky-50 text-sky-800 text-sm px-3.5 py-2.5">{info}</div> : null}
                {error ? <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3.5 py-2.5">{error}</div> : null}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <input
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
                      Password
                    </label>
                    <button
                      className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                      type="button"
                      onClick={() => setInfo('Password reset is not available. Please use your existing password.')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      autoComplete="current-password"
                      className="w-full rounded-lg border border-slate-200 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                      id="password"
                      name="password"
                      placeholder="••••••••••••"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60"
                    disabled={busy}
                    type="submit"
                  >
                    {busy ? 'Signing in...' : 'Log In'}
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-slate-50/70 border-t border-slate-100 py-4 px-8 text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link className="font-medium text-sky-600 hover:text-sky-700 hover:underline" to="/register">
                Register
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full py-6 text-center text-xs text-slate-400">
        <p>© 2025 Secure File Transfer. All rights reserved.</p>
      </footer>
    </div>
  );
}
