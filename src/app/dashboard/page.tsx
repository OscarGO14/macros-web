'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { getToday } from '@/utils/getToday';
import { getCurrentWeekDates } from '@/utils/getCurrentWeekDates';
import { getMonthStats, getPrevMonthPrefix } from '@/utils/getMonthStats';
import DoughnutChart from '@/components/DoughnutChart';
import BarChartComponent from '@/components/BarChart';
import Screen from '@/components/ui/Screen';
import SettingsItem from '@/components/ui/SettingsItem';
import { SettingsControlType } from '@/components/ui/SettingsItem/types';
import { StatsCard } from '@/components/ui/StatsCard';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUserStore();

  const today = useMemo(() => getToday(), []);
  const weekDates = useMemo(() => getCurrentWeekDates(), []);

  const objective = user?.dailyGoals?.calories;
  const consumed = user?.history?.[today]?.totalMacros?.calories ?? 0;

  const currentMonthPrefix = useMemo(() => today.slice(0, 7), [today]);
  const prevMonthPrefix = useMemo(() => getPrevMonthPrefix(currentMonthPrefix), [currentMonthPrefix]);

  const currentMonthStats = useMemo(
    () => getMonthStats(user?.history ?? {}, currentMonthPrefix),
    [user?.history, currentMonthPrefix],
  );
  const prevMonthStats = useMemo(
    () => getMonthStats(user?.history ?? {}, prevMonthPrefix),
    [user?.history, prevMonthPrefix],
  );

  return (
    <Screen>
      <div className="flex flex-col items-center justify-evenly gap-4 flex-1">
        <div className="flex items-center justify-center">
          <p className="text-xl text-primary text-center py-4">
            Hola {user?.displayName || 'colega'}
          </p>
        </div>

        {objective !== undefined && (
          <DoughnutChart data={{ objective, consumed }} />
        )}

        {user && (
          <BarChartComponent
            history={user.history}
            today={today}
            weekDates={weekDates}
            dailyGoal={user.dailyGoals?.calories}
          />
        )}

        {currentMonthStats.daysLogged > 0 && (
          <div className="flex gap-3 w-full">
            <div className="flex-1">
              <StatsCard
                title={`Media ${currentMonthPrefix.slice(5)}`}
                value={currentMonthStats.avgCalories}
                variant="primary"
                trend={[
                  `Días: ${currentMonthStats.daysLogged}`,
                  `P: ${currentMonthStats.avgProteins}`,
                ]}
              />
            </div>
            {prevMonthStats.daysLogged > 0 && (
              <div className="flex-1">
                <StatsCard
                  title={`Media ${prevMonthPrefix.slice(5)}`}
                  value={prevMonthStats.avgCalories}
                  variant="secondary"
                  trend={[
                    `Días: ${prevMonthStats.daysLogged}`,
                    `P: ${prevMonthStats.avgProteins}`,
                  ]}
                />
              </div>
            )}
          </div>
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
