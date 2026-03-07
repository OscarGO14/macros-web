import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Collections } from "@/types/collections";
import { IUserStateData } from "@/types/user";
import { RetryService } from "./retryService";

/**
 * Centralized service for user-related Firebase operations
 * Provides consistent error handling and type safety
 */
export class UserService {
  /**
   * Get user data by UID with retry logic
   */
  static async getUser(uid: string): Promise<IUserStateData | null> {
    return RetryService.executeWithRetry(
      async () => {
        const userDoc = doc(db, Collections.USERS, uid);
        const snapshot = await getDoc(userDoc);

        if (snapshot.exists()) {
          return snapshot.data() as IUserStateData;
        }

        return null; // Usuario no encontrado (caso válido)
      },
      {
        maxRetries: 2, // Menos reintentos para lectura
      },
    );
  }

  /**
   * Update user data with retry logic
   */
  static async updateUser(
    uid: string,
    data: Partial<IUserStateData>,
  ): Promise<void> {
    return RetryService.executeWithRetry(
      async () => {
        const userDoc = doc(db, Collections.USERS, uid);
        await updateDoc(userDoc, data);
        console.log("Usuario actualizado exitosamente");
      },
      {
        maxRetries: 3, // Más reintentos para escritura
      },
    );
  }

  /**
   * Delete user document
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      const userDoc = doc(db, Collections.USERS, uid);
      await deleteDoc(userDoc);
      console.log("Usuario eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

}
