import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SendFilePage from './pages/SendFilePage';
import SecureLinkPage from './pages/SecureLinkPage';
import ReceiveFilePage from './pages/ReceiveFilePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';

function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-body-md">
        Loading...
      </div>
    );
  }
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?next=${encodeURIComponent(next)}`} />;
  }
  return children;
}

function Guest({ children }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant font-body-md">
        Loading...
      </div>
    );
  }
  if (user) return <Navigate replace to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <LoginPage />
          </Guest>
        }
      />
      <Route
        path="/register"
        element={
          <Guest>
            <RegisterPage />
          </Guest>
        }
      />
      <Route
        path="/"
        element={
          <Protected>
            <HomePage />
          </Protected>
        }
      />
      <Route
        path="/send"
        element={
          <Protected>
            <SendFilePage />
          </Protected>
        }
      />
      <Route
        path="/link"
        element={
          <Protected>
            <SecureLinkPage />
          </Protected>
        }
      />
      <Route
        path="/receive"
        element={<ReceiveFilePage />}
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route
        path="/help"
        element={
          <Protected>
            <HelpPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
