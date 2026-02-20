import { InputHTMLAttributes } from 'react';

export interface InputTextProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'disabled'> {
  /** Texto opcional a mostrar encima del input como etiqueta */
  label?: string;
  /** Nodo React opcional a mostrar dentro del input, a la izquierda (ej. un icono de react-icons) */
  icon?: React.ReactNode;
  /** Mensaje de error opcional a mostrar debajo del input */
  errorMessage?: string;
  /** Clases CSS adicionales para el contenedor principal */
  containerClassName?: string;
  /** Indica si el input está deshabilitado */
  disabled?: boolean;
}
