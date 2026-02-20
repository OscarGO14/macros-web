import { Goals } from '@/types/goals';
import { History } from '@/types/history';

// Define la forma de los datos del usuario que quieres almacenar
export interface IUserStateData {
  uid: string;
  email: string | null;
  displayName?: string | null;
  dailyGoals?: Goals;
  history?: History;
}
// Define la forma completa del estado, incluyendo el usuario y posibles estados de carga/error
export interface IUserState {
  user: IUserStateData | null;
  isLoading: boolean;
  error: Error | null;
  setUser: (user: IUserStateData | null) => void; // Acción para actualizar el usuario
  updateUserData: (user: IUserStateData) => void; // Acción para actualizar el usuario
  setLoading: (loading: boolean) => void; // Acción para estado de carga
  setError: (error: Error | null) => void; // Acción para manejar errores
  clearUser: () => void; // Acción para limpiar el estado del usuario (logout)
}
