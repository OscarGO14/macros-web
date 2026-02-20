import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, usersCollection } from './firebase';
import { Collections } from '@/types/collections';
import { IUserStateData } from '@/types/user';
import { RetryService } from './retryService';

/**
 * Centralized service for user-related Firebase operations
 * Provides consistent error handling and type safety
 */
export class UserService {
  /**
   * Get user data by UID with retry logic
   */
  static async getUser(uid: string): Promise<IUserStateData | null> {
    return RetryService.executeWithRetry(async () => {
      const userDoc = doc(db, Collections.USERS, uid);
      const snapshot = await getDoc(userDoc);

      if (snapshot.exists()) {
        return snapshot.data() as IUserStateData;
      }

      return null; // Usuario no encontrado (caso válido)
    }, {
      maxRetries: 2 // Menos reintentos para lectura
    });
  }

  /**
   * Create a new user document
   */
  static async createUser(uid: string, userData: IUserStateData): Promise<void> {
    try {
      const userDoc = doc(db, Collections.USERS, uid);
      await setDoc(userDoc, userData);
      console.log('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user data with retry logic
   */
  static async updateUser(uid: string, data: Partial<IUserStateData>): Promise<void> {
    return RetryService.executeWithRetry(async () => {
      const userDoc = doc(db, Collections.USERS, uid);
      await updateDoc(userDoc, data);
      console.log('Usuario actualizado exitosamente');
    }, {
      maxRetries: 3 // Más reintentos para escritura
    });
  }

  /**
   * Delete user document
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      const userDoc = doc(db, Collections.USERS, uid);
      await deleteDoc(userDoc);
      console.log('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user's daily goals
   */
  static async updateUserGoals(uid: string, goals: Partial<IUserStateData['dailyGoals']>): Promise<void> {
    try {
      await this.updateUser(uid, { dailyGoals: goals as IUserStateData['dailyGoals'] });
    } catch (error) {
      throw new Error(`Failed to update user goals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user's history for a specific day
   */
  static async updateUserHistory(uid: string, day: string, dayData: any): Promise<void> {
    try {
      const user = await this.getUser(uid);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedHistory = {
        ...user.history,
        [day]: dayData
      };

      await this.updateUser(uid, { history: updatedHistory });
    } catch (error) {
      throw new Error(`Failed to update user history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user exists
   */
  static async userExists(uid: string): Promise<boolean> {
    try {
      const user = await this.getUser(uid);
      return user !== null;
    } catch (error) {
      // Si hay error al obtener usuario, asumimos que no existe
      return false;
    }
  }
}