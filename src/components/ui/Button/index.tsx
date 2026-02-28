import React from 'react';
import type { ButtonProps } from './types';

export const Button: React.FC<ButtonProps> = ({
  title,
  className = '',
  textClassName = '',
  ...props
}) => {
  return (
    <button
      className={`bg-primary hover:bg-accent active:bg-accent active:opacity-70 px-6 py-3 rounded-full flex items-center justify-center transition-colors cursor-pointer ${className}`}
      {...props}
    >
      <span className={`text-base text-secondary font-bold ${textClassName}`}>{title}</span>
    </button>
  );
};

export default Button;
