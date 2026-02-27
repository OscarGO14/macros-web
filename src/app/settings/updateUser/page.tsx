'use client';
import { useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import InputText from '@/components/ui/InputText';
import { useUserStore } from '@/store/userStore';
import { Goals } from '@/types/goals';
import { updateUser } from '@/services/firebase';
import Screen from '@/components/ui/Screen';
import ConfirmationModal from '@/components/ConfirmationModal';
import { validateMacroGoals, validateDisplayName } from '@/utils/validation';

export default function UpdateUserPage() {
  const { user, setUser } = useUserStore();

  const [displayName, setDisplayName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setCalories(user.dailyGoals?.calories?.toString() || '');
      setProteins(user.dailyGoals?.proteins?.toString() || '');
      setCarbs(user.dailyGoals?.carbs?.toString() || '');
      setFats(user.dailyGoals?.fats?.toString() || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error ?? 'Nombre inválido.');
      return;
    }

    const numCalories = parseInt(calories, 10);
    const numProteins = parseInt(proteins, 10);
    const numCarbs = parseInt(carbs, 10);
    const numFats = parseInt(fats, 10);
    const macroValidation = validateMacroGoals(numCalories, numProteins, numCarbs, numFats);

    if (!macroValidation.overall.isValid) {
      const errors = [
        macroValidation.calories.error,
        macroValidation.proteins.error,
        macroValidation.carbs.error,
        macroValidation.fats.error,
        macroValidation.overall.error,
      ]
        .filter(Boolean)
        .join('\n');
      toast.error(errors || 'Valores inválidos.');
      return;
    }

    setLoading(true);
    const updatedGoals: Goals = {
      calories: numCalories,
      proteins: numProteins,
      carbs: numCarbs,
      fats: numFats,
    };
    const dataToUpdate: Partial<typeof user> = { displayName, dailyGoals: updatedGoals };
    const updatedUser = { ...user, ...dataToUpdate };
    const previousUser = user;
    setUser(updatedUser);

    try {
      await updateUser(user.uid, dataToUpdate);
      toast.success('Los cambios se han guardado correctamente.');
    } catch (error) {
      setUser(previousUser);
      let errorMessage = 'Ocurrió un error al guardar los cambios.';
      if (error instanceof FirebaseError) {
        errorMessage = `Error: ${error.message} (${error.code})`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <p className="mt-4 text-primary">Cargando datos del usuario...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-col justify-around gap-6">
        <h1 className="text-2xl font-bold text-primary">Actualiza tu información</h1>

        <div className="w-full flex flex-col gap-4">
          <InputText
            label="Nombre de Usuario"
            placeholder="Tu nombre de usuario"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <InputText
            label="Calorías (kcal)"
            placeholder="Calorías (kcal)"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
          <InputText
            label="Proteínas (g)"
            placeholder="Proteínas (g)"
            type="number"
            value={proteins}
            onChange={(e) => setProteins(e.target.value)}
          />
          <InputText
            label="Carbohidratos (g)"
            placeholder="Carbohidratos (g)"
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
          />
          <InputText
            label="Grasas (g)"
            placeholder="Grasas (g)"
            type="number"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-center text-alternate">Guardando...</p>
        ) : (
          <Button
            title="Guardar Cambios"
            onClick={() => setShowConfirmationModal(true)}
            className="bg-accent"
          />
        )}
      </div>

      <ConfirmationModal
        isVisible={showConfirmationModal}
        handleConfirm={handleSave}
        onClose={() => setShowConfirmationModal(false)}
        message="¿Estás seguro de que quieres guardar los cambios?"
      />
    </Screen>
  );
}
