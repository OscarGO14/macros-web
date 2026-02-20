import { ItemType } from '@/types/itemType';

export { ItemType };

export interface ItemProps {
  name: string;
  type: (typeof ItemType)[keyof typeof ItemType];
  calories: number;
  showType?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}
