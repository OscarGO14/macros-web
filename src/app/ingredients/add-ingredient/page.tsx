'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import { useIngredientStore } from '@/store/ingredientStore';
import { Collections } from '@/types/collections';
import InputText from '@/components/ui/InputText';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';

const CATEGORIES = [
  'carnes',
  'pescado',
  'verduras',
  'frutas',
  'cereales',
  'lácteos',
  'legumbres',
  'huevos',
  'otra',
];

export default function AddIngredientPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const addIngredientToStore = useIngredientStore(s => s.addIngredient);
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
      const docRef = await addDoc(collection(db, Collections.INGREDIENTS), ingredientData);
      addIngredientToStore({ id: docRef.id, ...ingredientData });
      toast.success('Ingrediente añadido correctamente.');
      router.back();
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
        <div className="flex flex-col gap-1">
          <label className="text-sm text-alternate">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-item-background border border-alternate/20 rounded-lg p-3 text-primary w-full outline-none"
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
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
