import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { Collections } from '@/types/collections';
import { IUserStateData } from '@/types/user';
import { useUserStore } from '@/store/userStore';
import { UserService } from './userService';
import { RetryService, OperationQueue } from './retryService';

/**
 * Service for managing data synchronization between Firebase and local state
 * Ensures data consistency and handles conflict resolution
 */
export class SyncService {
  private static listeners: Map<string, Unsubscribe> = new Map();
  private static syncState: Map<string, { lastSync: number; version: number }> = new Map();

  /**
   * Start real-time synchronization for a user
   */
  static startUserSync(uid: string): void {
    // Stop existing listener if any
    this.stopUserSync(uid);

    console.log(`Starting real-time sync for user: ${uid}`);

    const userDoc = doc(db, Collections.USERS, uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const firebaseData = snapshot.data() as IUserStateData;
          this.handleUserDataUpdate(uid, firebaseData);
        } else {
          console.warn(`User document not found for uid: ${uid}`);
          // Usuario eliminado desde otro dispositivo
          useUserStore.getState().setUser(null);
        }
      },
      (error) => {
        console.error('Error in user sync listener:', error);
        // En caso de error, intentar reconectar después de un delay
        setTimeout(() => {
          if (this.listeners.has(uid)) {
            console.log('Attempting to restart user sync...');
            this.startUserSync(uid);
          }
        }, 5000);
      }
    );

    this.listeners.set(uid, unsubscribe);
  }

  /**
   * Stop real-time synchronization for a user
   */
  static stopUserSync(uid: string): void {
    const unsubscribe = this.listeners.get(uid);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(uid);
      console.log(`Stopped sync for user: ${uid}`);
    }
  }

  /**
   * Stop all active synchronizations
   */
  static stopAllSync(): void {
    this.listeners.forEach((unsubscribe, uid) => {
      unsubscribe();
      console.log(`Stopped sync for user: ${uid}`);
    });
    this.listeners.clear();
  }

  /**
   * Handle incoming user data from Firebase
   */
  private static handleUserDataUpdate(uid: string, firebaseData: IUserStateData): void {
    const currentUser = useUserStore.getState().user;
    const lastSync = this.syncState.get(uid)?.lastSync || 0;
    const now = Date.now();

    // Evitar loops de sincronización si la actualización es muy reciente
    if (now - lastSync < 1000) {
      console.log('Skipping sync update - too recent');
      return;
    }

    // Si no hay usuario local o los datos son diferentes, actualizar
    if (!currentUser || this.hasDataChanges(currentUser, firebaseData)) {
      console.log('Updating local state from Firebase');
      useUserStore.getState().setUser(firebaseData);

      this.syncState.set(uid, {
        lastSync: now,
        version: this.syncState.get(uid)?.version || 0
      });
    }
  }

  /**
   * Compare two user data objects for changes
   */
  private static hasDataChanges(local: IUserStateData, remote: IUserStateData): boolean {
    // Comparación simple de campos clave
    if (local.displayName !== remote.displayName) return true;

    // Comparar goals
    if (JSON.stringify(local.dailyGoals) !== JSON.stringify(remote.dailyGoals)) return true;

    // Comparar history (más complejo debido a anidación)
    const localHistoryKeys = Object.keys(local.history || {});
    const remoteHistoryKeys = Object.keys(remote.history || {});

    if (localHistoryKeys.length !== remoteHistoryKeys.length) return true;

    for (const day of localHistoryKeys) {
      const dayKey = day as keyof NonNullable<typeof local.history>;
      if (JSON.stringify(local.history?.[dayKey]) !== JSON.stringify(remote.history?.[dayKey])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sync local changes to Firebase with conflict resolution
   */
  static async syncUserToFirebase(
    uid: string,
    localData: IUserStateData,
    options: { force?: boolean; retryOnConflict?: boolean } = {}
  ): Promise<boolean> {
    try {
      const syncInfo = this.syncState.get(uid);

      if (!options.force && syncInfo) {
        // Verificar si hay cambios remotos más recientes
        const remoteData = await UserService.getUser(uid);
        if (remoteData && this.hasDataChanges(localData, remoteData)) {
          console.log('Conflict detected: remote data is newer');

          if (options.retryOnConflict) {
            // Intentar merge automático
            const mergedData = this.mergeUserData(localData, remoteData);
            await UserService.updateUser(uid, mergedData);
            useUserStore.getState().setUser(mergedData);
            return true;
          } else {
            // Reportar conflicto
            console.warn('Sync conflict - manual resolution required');
            return false;
          }
        }
      }

      // Actualizar Firebase
      await UserService.updateUser(uid, localData);

      // Actualizar estado de sincronización
      this.syncState.set(uid, {
        lastSync: Date.now(),
        version: (syncInfo?.version || 0) + 1
      });

      return true;
    } catch (error) {
      console.error('Error syncing to Firebase:', error);

      // Añadir a cola para reintentar más tarde
      OperationQueue.enqueue(
        `sync-user-${uid}`,
        () => this.syncUserToFirebase(uid, localData, options)
      );

      throw error;
    }
  }

  /**
   * Merge local and remote data (simple strategy)
   */
  private static mergeUserData(local: IUserStateData, remote: IUserStateData): IUserStateData {
    // Estrategia simple: usar remote para campos básicos, merge para history
    const merged: IUserStateData = {
      ...remote, // Base remota
      history: this.mergeHistory(local.history || {}, remote.history || {})
    };

    return merged;
  }

  /**
   * Merge history data from local and remote
   */
  private static mergeHistory(
    local: Record<string, any>,
    remote: Record<string, any>
  ): Record<string, any> {
    const merged = { ...remote };

    // Para cada día en local, comparar con remote
    Object.keys(local).forEach(day => {
      const localDay = local[day];
      const remoteDay = remote[day];

      if (!remoteDay) {
        // Día solo existe en local
        merged[day] = localDay;
      } else {
        // Día existe en ambos - usar el que tenga más comidas
        const localMealsCount = localDay?.meals?.length || 0;
        const remoteMealsCount = remoteDay?.meals?.length || 0;

        merged[day] = localMealsCount > remoteMealsCount ? localDay : remoteDay;
      }
    });

    return merged;
  }

  /**
   * Force sync from Firebase to local state
   */
  static async forceSyncFromFirebase(uid: string): Promise<void> {
    try {
      const remoteData = await UserService.getUser(uid);
      if (remoteData) {
        useUserStore.getState().setUser(remoteData);
        this.syncState.set(uid, {
          lastSync: Date.now(),
          version: 0
        });
        console.log('Forced sync from Firebase completed');
      }
    } catch (error) {
      console.error('Error forcing sync from Firebase:', error);
      throw error;
    }
  }

  /**
   * Get synchronization status
   */
  static getSyncStatus(uid: string): {
    isActive: boolean;
    lastSync: number | null;
    version: number;
  } {
    const hasListener = this.listeners.has(uid);
    const syncInfo = this.syncState.get(uid);

    return {
      isActive: hasListener,
      lastSync: syncInfo?.lastSync || null,
      version: syncInfo?.version || 0
    };
  }

  /**
   * Initialize sync service
   */
  static initialize(): void {
    console.log('SyncService initialized');

    // Limpiar listeners al cerrar la app
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopAllSync();
      });
    }
  }
}