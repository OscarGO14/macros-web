import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { Collections } from '@/types/collections';
import { IUserStateData } from '@/types/user';
import { useUserStore } from '@/store/userStore';

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
    // Detener listener existente si hay uno
    const existing = this.listeners.get(uid);
    if (existing) {
      existing();
      this.listeners.delete(uid);
    }

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