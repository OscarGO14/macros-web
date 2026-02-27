'use client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import BottomNav from '@/components/BottomNav';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  useAuthNavigation(isAuthenticated, isLoading);

  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/auth');
  const showNav = isAuthenticated && !isAuthRoute;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-alternate">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      {showNav && <BottomNav />}
    </>
  );
}
