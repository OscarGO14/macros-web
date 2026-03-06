'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/services/firebase';
import { Collections } from '@/types/collections';
import { useIngredients } from '@/hooks/useIngredients';
import { useIngredientStore } from '@/store/ingredientStore';
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

function EditIngredientForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const { data, loading } = useIngredients();
  const updateIngredient = useIngredientStore(s => s.updateIngredient);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!id) {
      toast.error('Ingrediente no encontrado.');
      router.back();
      return;
    }
    const ingredient = data?.find(i => i.id === id);
    if (!ingredient) {
      toast.error('Ingrediente no encontrado.');
      router.back();
      return;
    }
    setName(ingredient.name);
    setCategory(ingredient.category ?? '');
    setCalories(String(ingredient.calories));
    setProteins(String(ingredient.proteins));
    setCarbs(String(ingredient.carbs));
    setFats(String(ingredient.fats));
    setReady(true);
  }, [loading, data, id]);

  const handleSubmit = async () => {
    if (!name || !calories || !proteins || !carbs || !fats) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    const updatedData = {
      name,
      category: category || 'Sin categoría',
      calories: parseFloat(calories),
      proteins: parseFloat(proteins),
      carbs: parseFloat(carbs),
      fats: parseFloat(fats),
    };

    try {
      await updateDoc(doc(db, Collections.INGREDIENTS, id), updatedData);
      updateIngredient(id, updatedData);
      toast.success('Ingrediente actualizado.');
      router.back();
    } catch {
      toast.error('Error al actualizar el ingrediente.');
    }
  };

  if (loading || !ready) {
    return (
      <Screen>
        <p className="text-center text-alternate py-8">Cargando...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="w-full flex flex-col gap-2">
        <p className="text-xl font-bold text-primary mb-2">Editar Ingrediente</p>
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
          <SubmitButton label="Guardar cambios" onPress={handleSubmit} />
        </div>
      </div>
    </Screen>
  );
}

export default function EditIngredientPage() {
  return (
    <Suspense fallback={<Screen><p className="text-center text-alternate py-8">Cargando...</p></Screen>}>
      <EditIngredientForm />
    </Suspense>
  );
}
