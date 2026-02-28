'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import { getDayOfWeek } from '@/utils/getDayOfWeek';
import { createEmptyDailyLog } from '@/utils/createEmpytDailyLog';
import { isFromToday } from '@/utils/dateUtils';
import DoughnutChart from '@/components/DoughnutChart';
import BarChartComponent from '@/components/BarChart';
import Screen from '@/components/ui/Screen';
import SettingsItem from '@/components/ui/SettingsItem';
import { SettingsControlType } from '@/components/ui/SettingsItem/types';

export default function DashboardPage() {
  const router = useRouter();
  const [objective, setObjective] = useState<number | undefined>(undefined);
  const [consumed, setConsumed] = useState<number | undefined>(undefined);
  const { user, updateUserData } = useUserStore();
  const today = useMemo(() => getDayOfWeek(), []);

  useEffect(() => {
    const checkAndUpdateDailyLog = async () => {
      if (!user) return;

      const today = getDayOfWeek();
      const todayHistory = user.history?.[today];

      if (!todayHistory || !isFromToday(todayHistory.date)) {
        const newDailyLog = createEmptyDailyLog();
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { [`history.${today}`]: newDailyLog });

        updateUserData({ ...user, history: { ...user.history, [today]: newDailyLog } });
        setObjective(user.dailyGoals?.calories);
        setConsumed(0);
      } else {
        setObjective(user.dailyGoals?.calories);
        setConsumed(todayHistory.totalMacros?.calories);
      }
    };

    checkAndUpdateDailyLog();
  }, [user]);

  return (
    <Screen>
      <div className="flex flex-col items-center justify-evenly gap-4 flex-1">
        <div className="flex items-center justify-center">
          <p className="text-xl text-primary text-center py-4">
            Hola {user?.displayName || 'colega'}
          </p>
        </div>

        {objective !== undefined && (
          <DoughnutChart data={{ objective, consumed: consumed || 0 }} />
        )}

        {user && (
          <BarChartComponent
            history={user.history}
            today={today}
            dailyGoal={user.dailyGoals?.calories}
          />
        )}

        <SettingsItem
          label="Añadir comida"
          controlType={SettingsControlType.ARROW_ONLY}
          onPress={() => router.push('/meals/add-meal')}
        />
      </div>
    </Screen>
  );
}
