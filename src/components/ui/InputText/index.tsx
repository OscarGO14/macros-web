import React from 'react';
import { InputTextProps } from './types';

const InputText: React.FC<InputTextProps> = ({
  label,
  icon,
  errorMessage,
  containerClassName = '',
  disabled = false,
  ...inputProps
}) => {
  const hasError = !!errorMessage;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          className={`mb-1 block text-sm ${disabled ? 'text-alternate' : 'text-primary font-medium'}`}
        >
          {label}
        </label>
      )}
      <div
        className={`flex items-center rounded-lg p-2 border ${
          disabled ? 'opacity-50 bg-alternate' : 'bg-item-background'
        } ${hasError ? 'border-danger' : 'border-transparent'}`}
      >
        {icon && (
          <span
            className={`mr-2 flex-shrink-0 ${
              disabled ? 'text-alternate' : hasError ? 'text-danger' : 'text-primary'
            }`}
          >
            {icon}
          </span>
        )}
        <input
          {...inputProps}
          disabled={disabled}
          className={`flex-1 bg-transparent text-base outline-none placeholder:text-alternate ${
            disabled ? 'text-alternate cursor-not-allowed' : 'text-primary'
          }`}
        />
      </div>
      {hasError && <p className="mt-1 text-sm text-danger">{errorMessage}</p>}
    </div>
  );
};

export default InputText;
