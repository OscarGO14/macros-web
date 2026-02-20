import React from 'react';
import { MdChevronRight } from 'react-icons/md';
import { SettingsItemProps, SettingsControlType } from './types';

const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  controlType,
  value,
  onPress,
  disabled = false,
  icon,
}) => {
  const textColor = disabled ? 'text-alternate' : 'text-primary';

  const renderControl = () => {
    switch (controlType) {
      case SettingsControlType.SWITCH: {
        const switchValue = typeof value === 'boolean' ? value : false;
        return (
          <button
            role="switch"
            aria-checked={switchValue}
            onClick={disabled ? undefined : onPress}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              switchValue ? 'bg-accent' : 'bg-alternate'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-secondary transition-transform ${
                switchValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );
      }
      case SettingsControlType.TEXT_ARROW:
        return (
          <div className="flex items-center">
            <span className={`${textColor} mr-2`}>{typeof value === 'string' ? value : ''}</span>
            <MdChevronRight size={24} className={disabled ? 'text-alternate' : 'text-alternate'} />
          </div>
        );
      case SettingsControlType.ARROW_ONLY:
        return (
          <MdChevronRight size={24} className={disabled ? 'text-alternate' : 'text-alternate'} />
        );
      case SettingsControlType.NONE:
      default:
        return null;
    }
  };

  return (
    <button
      className={`flex w-full items-center bg-item-background p-4 rounded-lg text-left transition-opacity cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
      }`}
      onClick={controlType !== SettingsControlType.SWITCH ? onPress : undefined}
      disabled={disabled}
    >
      {icon && <span className={`${textColor} mr-4 flex-shrink-0`}>{icon}</span>}
      <span className={`flex-1 ${textColor} text-base`}>{label}</span>
      <div>{renderControl()}</div>
    </button>
  );
};

export default SettingsItem;
