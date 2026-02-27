'use client';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import { Collections } from '@/types/collections';
import InputText from '@/components/ui/InputText';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';

export default function AddIngredientPage() {
  const { user } = useUserStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para añadir ingredientes.');
      return;
    }
    if (!name || !calories || !proteins || !carbs || !fats) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    try {
      const ingredientData = {
        name,
        category: category || 'Sin categoría',
        calories: parseFloat(calories),
        proteins: parseFloat(proteins),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
      };
      await addDoc(collection(db, Collections.INGREDIENTS), ingredientData);
      toast.success('Ingrediente añadido correctamente.');
      setName('');
      setCategory('');
      setCalories('');
      setProteins('');
      setCarbs('');
      setFats('');
    } catch (error) {
      toast.error(`Error al guardar el ingrediente: ${error}`);
    }
  };

  return (
    <Screen>
      <div className="w-full flex flex-col gap-2">
        <InputText
          label="Nombre *"
          placeholder="Ej: Pollo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <InputText
          label="Categoría (Opcional)"
          placeholder="Ej: Carnes, Lácteos, Verduras..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <InputText
          label="Calorías (kcal) *"
          placeholder="Ej: 120"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <InputText
          label="Proteínas (g) *"
          placeholder="Ej: 25"
          type="number"
          value={proteins}
          onChange={(e) => setProteins(e.target.value)}
        />
        <InputText
          label="Carbohidratos (g)"
          placeholder="Ej: 0"
          type="number"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <InputText
          label="Grasas (g) *"
          placeholder="Ej: 5"
          type="number"
          value={fats}
          onChange={(e) => setFats(e.target.value)}
        />

        <div className="mt-4">
          <SubmitButton label="Añadir Ingrediente" onPress={handleSubmit} />
        </div>
      </div>
    </Screen>
  );
}
