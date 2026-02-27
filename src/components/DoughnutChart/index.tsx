'use client';
import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { MyColors } from '@/types/colors';

const theme = {
  objectiveColor: MyColors.PRIMARY,
  toEatColor: MyColors.ALTERNATE,
  consumedColor: MyColors.ACCENT,
  exceededColor: MyColors.DANGER,
};

type PieChartProps = {
  data?: {
    objective: number;
    consumed: number;
  };
};

const DoughnutChart = ({ data }: PieChartProps) => {
  if (!data || data.objective + data.consumed === 0) return null;

  const isExceeded = data.consumed > data.objective * 1.05;
  const consumedColor = isExceeded ? theme.exceededColor : theme.consumedColor;
  const remaining = Math.max(0, data.objective - data.consumed);

  const pieData = [
    { value: remaining, color: theme.toEatColor },
    { value: data.consumed, color: consumedColor },
  ];

  const consumedPercentage = ((data.consumed / data.objective) * 100).toFixed(0);

  return (
    <div className="flex flex-col justify-center">
      <p className="text-alternate">Tus calorías:</p>
      <div className="flex gap-1">
        {/* Leyenda */}
        <div className="flex flex-col gap-2 justify-center">
          <PieLabelRow
            label="Consumidas"
            value={Math.round(data.consumed).toString()}
            color={consumedColor}
          />
          <PieLabelRow
            label="Por consumir"
            value={Math.round(remaining).toString()}
            color={theme.toEatColor}
          />
          <PieLabelRow
            label="Objetivo"
            value={Math.round(data.objective).toString()}
            color={theme.objectiveColor}
          />
        </div>

        {/* Separador */}
        <div className="bg-alternate w-px mx-2" />

        {/* Gráfico */}
        <div className="flex items-center justify-center w-1/2">
          <div className="relative">
            <PieChart width={140} height={140}>
              <Pie
                data={pieData}
                cx={65}
                cy={65}
                innerRadius={42}
                outerRadius={62}
                dataKey="value"
                strokeWidth={0}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            {/* Etiqueta central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-primary text-[22px] font-bold leading-tight">
                {consumedPercentage}%
              </p>
              <p className="text-primary text-[13px]">Consumido</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PieLabelRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value?: string;
  color: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="rounded-[7px] h-[14px] w-[14px] flex-shrink-0" style={{ backgroundColor: color }} />
    <p className="text-primary text-base">{label}:</p>
    {value && <p className="text-primary text-base font-bold">{value}</p>}
  </div>
);

export default DoughnutChart;
