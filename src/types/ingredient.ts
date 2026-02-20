export interface Ingredient {
  id: string; // Añadido desde el doc.id de Firestore
  name: string;
  category?: string; // Opcional, por si algún dato no lo tiene
  calories: number;
  proteins: number; // Corregido de 'protein' si lo tenías así antes
  carbs: number;
  fats: number; // Renombrado de fat a fats
  // unit?: string; // Eliminar unidad, siempre será 'g'
  userId?: string; // Si es un ingrediente personalizado por un usuario
}
