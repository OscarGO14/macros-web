import { useEffect, useCallback } from 'react';
import { SyncService } from '@/services/syncService';
import { useUserStore } from '@/store/userStore';
import { IUserStateData } from '@/types/user';

/**
 * Hook for managing data synchronization between Firebase and local state
 * Automatically starts/stops sync based on user authentication status
 */
export const useDataSync = () => {
  const { user } = useUserStore();

  // Inicializar sincronización cuando hay usuario
  useEffect(() => {
    if (user?.uid) {
      SyncService.startUserSync(user.uid);

      return () => {
        SyncService.stopUserSync(user.uid);
      };
    } else {
      // Si no hay usuario, detener todas las sincronizaciones
      SyncService.stopAllSync();
    }
  }, [user?.uid]);

  // Función para forzar sincronización desde Firebase
  const forceSyncFromRemote = useCallback(async () => {
    if (user?.uid) {
      try {
        await SyncService.forceSyncFromFirebase(user.uid);
        return true;
      } catch (error) {
        console.error('Error forcing sync:', error);
        return false;
      }
    }
    return false;
  }, [user?.uid]);

  // Función para sincronizar cambios locales a Firebase
  const syncToRemote = useCallback(async (
    userData: IUserStateData,
    options: { force?: boolean; retryOnConflict?: boolean } = {}
  ) => {
    if (user?.uid) {
      try {
        return await SyncService.syncUserToFirebase(user.uid, userData, options);
      } catch (error) {
        console.error('Error syncing to remote:', error);
        return false;
      }
    }
    return false;
  }, [user?.uid]);

  // Obtener estado de sincronización
  const getSyncStatus = useCallback(() => {
    if (user?.uid) {
      return SyncService.getSyncStatus(user.uid);
    }
    return {
      isActive: false,
      lastSync: null,
      version: 0
    };
  }, [user?.uid]);

  return {
    isUserAuthenticated: !!user,
    syncStatus: getSyncStatus(),
    forceSyncFromRemote,
    syncToRemote,
    getSyncStatus
  };
};