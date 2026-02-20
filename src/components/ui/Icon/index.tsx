import { MyColors } from '@/types/colors';
import { IIcon } from './types';

export default function Icon({ icon: IconComponent, size = 32, color = MyColors.ACCENT, className = '' }: IIcon) {
  return <IconComponent size={size} color={color} className={className} />;
}
