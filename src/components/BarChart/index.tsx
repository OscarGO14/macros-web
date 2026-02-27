'use client';
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MyColors } from '@/types/colors';
import { DayOfWeek, dayOfWeekArray, History } from '@/types/history';
import { createEmptyDailyLog } from '@/utils/createEmpytDailyLog';
import { formatDay } from '@/utils/translator';

const fallbackHistory: History = {
  monday: createEmptyDailyLog(),
  tuesday: createEmptyDailyLog(),
  wednesday: createEmptyDailyLog(),
  thursday: createEmptyDailyLog(),
  friday: createEmptyDailyLog(),
  saturday: createEmptyDailyLog(),
  sunday: createEmptyDailyLog(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: MyColors.ALTERNATE,
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        <p style={{ color: MyColors.PRIMARY, fontSize: 12 }}>{payload[0].value} kcal</p>
      </div>
    );
  }
  return null;
};

const BarChartComponent = ({
  history = fallbackHistory,
  today,
  dailyGoal = 1700,
}: {
  history?: History;
  today: DayOfWeek;
  dailyGoal?: number;
}) => {
  const daysArray = useMemo(() => {
    const todayIndex = dayOfWeekArray.indexOf(today);
    return [
      ...dayOfWeekArray.slice(todayIndex + 1),
      ...dayOfWeekArray.slice(0, todayIndex + 1),
    ];
  }, [today]);

  const barData = useMemo(
    () =>
      daysArray.map((day) => {
        const dayCalories = history?.[day]?.totalMacros?.calories ?? 0;
        const isToday = day === today;

        let color: string = MyColors.ALTERNATE;
        if (dayCalories > 0) {
          if (dayCalories > dailyGoal * 0.9 && dayCalories < dailyGoal * 1.05) {
            color = MyColors.ACCENT;
          } else if (dayCalories < dailyGoal * 0.9) {
            color = MyColors.PRIMARY;
          } else {
            color = MyColors.DANGER;
          }
        }

        return {
          name: formatDay(day),
          value: dayCalories,
          color,
          labelColor: isToday ? MyColors.ACCENT : MyColors.ALTERNATE,
        };
      }),
    [history, dailyGoal, daysArray, today],
  );

  return (
    <div className="flex flex-col items-center w-full rounded-lg gap-2">
      <p className="text-lg font-semibold text-alternate">Tus últimos 7 Días</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke={MyColors.ALTERNATE}
            tick={{ fill: MyColors.ALTERNATE, fontSize: 12 }}
          />
          <YAxis
            stroke={MyColors.ALTERNATE}
            tick={{ fill: MyColors.ALTERNATE, fontSize: 11 }}
            domain={[0, 2200]}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <ReferenceLine
            y={dailyGoal}
            stroke={MyColors.ACCENT}
            strokeDasharray="4 4"
            strokeWidth={2}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={28}>
            {barData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rotate-45"
          style={{ backgroundColor: MyColors.ACCENT }}
        />
        <p className="text-xs text-primary">Objetivo: {dailyGoal} kcal</p>
      </div>
    </div>
  );
};

export default BarChartComponent;
