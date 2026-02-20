import React from 'react';
import { StatsCardProps } from './types';

export const StatsCard = ({
  title,
  value,
  variant = 'primary',
  trend = [],
  formatValue,
  children,
}: StatsCardProps) => {
  const borderVariantClasses = {
    primary: 'border-primary',
    secondary: 'border-alternate',
    accent: 'border-primary',
  };

  const textValueVariantClasses = {
    primary: 'text-primary',
    secondary: 'text-alternate',
    accent: 'text-secondary',
  };

  const backgroundVariantClasses = {
    primary: 'bg-item-background',
    secondary: 'bg-alternate',
    accent: 'bg-accent',
  };

  const trendVariantClasses = {
    primary: 'text-accent',
    secondary: 'text-primary',
    accent: 'text-secondary',
  };

  return (
    <div
      className={`${backgroundVariantClasses[variant]} p-4 rounded-lg border w-full ${borderVariantClasses[variant]}`}
    >
      <p className={`text-base ${textValueVariantClasses[variant]} opacity-80 mb-1`}>{title}</p>

      <div className="flex items-end justify-between">
        <p className={`text-3xl font-bold ${textValueVariantClasses[variant]}`}>
          {formatValue ? formatValue(value) : value} kcal
        </p>

        {trend && trend.length > 0 && (
          <div className="flex items-center gap-4">
            {trend.map((item, index) => (
              <span key={index} className={`text-sm ${trendVariantClasses[variant]}`}>
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
