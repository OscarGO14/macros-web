import type { IconType } from 'react-icons';

export interface IIcon {
  /** Componente de react-icons a renderizar */
  icon: IconType;
  size?: number;
  color?: string;
  className?: string;
}
