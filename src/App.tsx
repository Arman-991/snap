import { Suspense, lazy, useEffect, useState } from 'react';
import { CustomerApp } from './CustomerApp';

const AdminApp = lazy(() => import('./admin/AdminApp'));

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(isAdminPath);

  useEffect(() => {
    const onPopState = () => setIsAdminRoute(isAdminPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#F6F7F5] p-6">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#E4E7E2] border-t-[#15663C]" />
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  }

  return <CustomerApp />;
}
