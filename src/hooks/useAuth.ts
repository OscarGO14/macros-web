import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { UserService } from '@/services/userService';
import { SyncService } from '@/services/syncService';
import { useUserStore } from '@/store/userStore';

/**
 * Custom hook that manages authentication state and user data synchronization
 * Separates auth logic from components for better maintainability
 */
export const useAuth = () => {
  const { user, isLoading, setUser, setLoading } = useUserStore();

  useEffect(() => {
    setLoading(true); // Asegurarse de que estamos cargando al inicio

    // Inicializar servicio de sincronización
    SyncService.initialize();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);

      try {
        if (firebaseUser) {
          try {
            // Esperar a que getUserQuery termine
            const userData = await UserService.getUser(firebaseUser.uid);
            if (userData) {
              setUser(userData);
              // Iniciar sincronización en tiempo real
              SyncService.startUserSync(firebaseUser.uid);
            } else {
              // Usuario autenticado en Firebase pero sin datos en Firestore
              console.warn('Usuario autenticado pero no encontrado en Firestore:', firebaseUser.uid);
              setUser(null);
            }
          } catch (getUserError) {
            // Error al obtener datos del usuario desde Firestore
            console.error('Error al obtener datos del usuario:', getUserError);
            setUser(null);
          }
        } else {
          setUser(null);
          // Detener sincronización cuando no hay usuario
          SyncService.stopAllSync();
        }
      } catch (error) {
        console.error('Error durante el chequeo de autenticación:', error);
        setUser(null); // Asegurarse de resetear en caso de error
      } finally {
        setLoading(false); // Poner loading en false DESPUÉS de procesar todo
      }
    });

    return () => {
      unsubscribe();
      SyncService.stopAllSync();
    };
  }, [setUser, setLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
};