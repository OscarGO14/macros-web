import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Custom hook que gestiona la navegación basada en autenticación.
 * Redirige según el estado de auth y la ruta actual.
 */
export const useAuthNavigation = (isAuthenticated: boolean, isLoading: boolean) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = pathname.startsWith('/auth');
    const isAtRoot = pathname === '/';

    if (!isAuthenticated && !inAuthGroup) {
      // Usuario no autenticado y no está en páginas de auth → redirigir a login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Usuario autenticado pero está en páginas de auth → redirigir a app
      router.replace('/dashboard');
    } else if (isAuthenticated && isAtRoot) {
      // Usuario autenticado pero está en la raíz → redirigir a app
      router.replace('/dashboard');
    }
    // Casos sin redirección:
    // - Usuario no autenticado y está en /auth → ya está donde debe
    // - Usuario autenticado y está en /dashboard o similar → ya está donde debe
  }, [isAuthenticated, pathname, router, isLoading]);
};
