import React from 'react';
import { ActionButtonProps } from './types';

const colorConfig: Record<string, { backgroundColor: string; textColor: string }> = {
  primary: { backgroundColor: 'primary', textColor: 'secondary' },
  secondary: { backgroundColor: 'secondary', textColor: 'primary' },
  accent: { backgroundColor: 'accent', textColor: 'secondary' },
  danger: { backgroundColor: 'danger', textColor: 'primary' },
};

export default function ActionButton({
  onPress,
  label,
  disabled = false,
  color = 'primary',
}: ActionButtonProps) {
  const config = colorConfig[color] ?? colorConfig.primary;

  return (
    <button
      className={`bg-${config.backgroundColor} rounded-lg p-4 w-full flex items-center justify-center transition-opacity cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 active:opacity-70'
      }`}
      onClick={onPress}
      disabled={disabled}
    >
      <span className={`text-base text-${config.textColor} font-bold`}>{label}</span>
    </button>
  );
}
