import React, { useMemo } from 'react';
import {
  MdFoodBank,
  MdBreakfastDining,
  MdFastfood,
  MdTakeoutDining,
  MdRamenDining,
  MdBrunchDining,
  MdOutdoorGrill,
  MdEdit,
  MdDelete,
  MdHelpOutline,
} from 'react-icons/md';
import { FaFish } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { ItemProps, ItemType } from './types';
import { getRandomElement } from '@/utils/getRandomElement';
import { MyColors } from '@/types/colors';

const INGREDIENT_ICONS: IconType[] = [MdFoodBank, MdBreakfastDining, MdFastfood, FaFish];
const RECIPE_ICONS: IconType[] = [MdTakeoutDining, MdRamenDining, MdBrunchDining, MdOutdoorGrill];

const Item: React.FC<ItemProps> = ({ name, type, calories, onDelete, showType = true, onEdit }) => {
  const IconComponent = useMemo((): IconType => {
    switch (type) {
      case ItemType.INGREDIENT:
        return getRandomElement(INGREDIENT_ICONS) ?? MdFoodBank;
      case ItemType.RECIPE:
        return getRandomElement(RECIPE_ICONS) ?? MdTakeoutDining;
      default:
        return MdHelpOutline;
    }
  }, [type]);

  const formattedType = () => {
    switch (type) {
      case ItemType.INGREDIENT:
        return 'Ingrediente';
      case ItemType.RECIPE:
        return 'Receta';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="w-full flex items-center justify-between bg-item-background p-4 rounded-lg">
      <IconComponent size={24} color={MyColors.PRIMARY} className="mr-4 flex-shrink-0" />

      <div className="flex-1 mr-4">
        <p className="text-primary font-bold text-base">{name}</p>
        {showType && <p className="text-alternate text-sm capitalize">{formattedType()}</p>}
      </div>

      <span className="text-primary font-semibold text-base">{calories} kcal</span>

      {onEdit && (
        <button className="ml-8 cursor-pointer" onClick={onEdit} aria-label="Editar">
          <MdEdit size={24} color={MyColors.ACCENT} />
        </button>
      )}
      {onDelete && (
        <button className="ml-8 cursor-pointer" onClick={onDelete} aria-label="Eliminar">
          <MdDelete size={24} color={MyColors.DANGER} />
        </button>
      )}
    </div>
  );
};

export default Item;
