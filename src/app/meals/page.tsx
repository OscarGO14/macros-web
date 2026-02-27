'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Screen from '@/components/ui/Screen';
import { StatsCard } from '@/components/ui/StatsCard';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useUserStore } from '@/store/userStore';
import { getDayOfWeek } from '@/utils/getDayOfWeek';
import { updateUser } from '@/services/firebase';
import { createEmptyDailyLog } from '@/utils/createEmpytDailyLog';

export default function MealsPage() {
  const { user, updateUserData } = useUserStore();
  const router = useRouter();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const today = useMemo(() => getDayOfWeek(), []);

  const deleteMealsForToday = async () => {
    if (!user) {
      toast.error('Usuario no encontrado.');
      return;
    }
    const emptyLog = createEmptyDailyLog();
    await updateUser(user.uid, { history: { ...user.history, [today]: emptyLog } });
    updateUserData({ ...user, history: { ...user.history, [today]: emptyLog } });
    toast.success('Se han borrado las comidas de hoy.');
  };

  const dailyTotalMacros = useMemo(() => {
    if (user?.history?.[today]) return user.history[today].totalMacros;
    return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  }, [user, today]);

  const dailyMeals = useMemo(() => {
    return user?.history?.[today]?.meals ?? [];
  }, [user, today]);

  return (
    <Screen>
      <div className="flex flex-col gap-3 py-4">
        <p className="text-lg font-semibold text-primary">Mis comidas de hoy</p>

        {dailyMeals.length === 0 ? (
          <p className="text-center text-alternate py-8">No has registrado comidas hoy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dailyMeals.map((meal, index) => (
              <li key={index}>
                <StatsCard
                  title={`Comida ${index + 1}`}
                  value={meal.totalMacros.calories}
                  trend={[
                    `P: ${meal.totalMacros.proteins.toFixed(1)}`,
                    `C: ${meal.totalMacros.carbs.toFixed(1)}`,
                    `G: ${meal.totalMacros.fats.toFixed(1)}`,
                  ]}
                >
                  {meal.items.map((item) => (
                    <p className="text-accent italic py-1 text-sm" key={item.id}>
                      {item.name}
                    </p>
                  ))}
                </StatsCard>
              </li>
            ))}
          </ul>
        )}

        <StatsCard
          title="Total"
          value={dailyTotalMacros.calories}
          variant="accent"
          trend={[
            `P: ${dailyTotalMacros.proteins.toFixed(1)}`,
            `C: ${dailyTotalMacros.carbs.toFixed(1)}`,
            `G: ${dailyTotalMacros.fats.toFixed(1)}`,
          ]}
        />

        <div className="flex gap-3">
          <ActionButton label="Borrar comidas" onPress={() => setShowConfirmationModal(true)} />
          <ActionButton
            color="accent"
            label="Añadir comida"
            onPress={() => router.push('/meals/add-meal')}
          />
        </div>

        <ConfirmationModal
          isVisible={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          handleConfirm={deleteMealsForToday}
          message="¿Estás seguro de que quieres borrar todas las comidas registradas para hoy? Esta acción no se puede deshacer."
        />
      </div>
    </Screen>
  );
}
