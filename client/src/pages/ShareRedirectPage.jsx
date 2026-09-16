import { Navigate, useParams } from 'react-router-dom';

export default function ShareRedirectPage() {
  const { token } = useParams();
  return <Navigate replace to={`/receive?token=${encodeURIComponent(token || '')}`} />;
}
