// Tipo de control que se mostrará a la derecha (usando as const)
export const SettingsControlType = {
  SWITCH: 'switch',
  TEXT_ARROW: 'text_arrow',
  ARROW_ONLY: 'arrow_only',
  NONE: 'none',
} as const;

type SettingsControlValue = (typeof SettingsControlType)[keyof typeof SettingsControlType];

export interface SettingsItemProps {
  /** Texto principal del elemento */
  label: string;
  /** Tipo de control a mostrar a la derecha */
  controlType: SettingsControlValue;
  /** Valor actual (relevante para SWITCH y TEXT_ARROW) */
  value?: boolean | string;
  /** Función a llamar cuando el valor cambia o se presiona el item */
  onPress?: () => void;
  /** Indica si el item está deshabilitado */
  disabled?: boolean;
  /** Opcional: Nodo React a mostrar a la izquierda del label (ej. un icono de react-icons) */
  icon?: React.ReactNode;
}
