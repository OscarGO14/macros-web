import { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Texto del botón */
  title: string;
  /** Estilos extra para el contenedor */
  className?: string;
  /** Estilos extra para el texto */
  textClassName?: string;
}
