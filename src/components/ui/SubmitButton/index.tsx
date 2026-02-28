import React from 'react';
import { SubmitButtonProps } from './types';

export default function SubmitButton({ onPress, label, disabled = false }: SubmitButtonProps) {
  return (
    <button
      className={`bg-accent rounded-lg p-4 w-full flex items-center justify-center cursor-pointer transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:opacity-90 active:opacity-70'
      }`}
      onClick={onPress}
      disabled={disabled}
    >
      <span className="text-base text-secondary font-bold">{label}</span>
    </button>
  );
}
