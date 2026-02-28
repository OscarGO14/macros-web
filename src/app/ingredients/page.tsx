'use client';
import { useRouter } from 'next/navigation';
import SettingsItem from '@/components/ui/SettingsItem';
import { SettingsControlType } from '@/components/ui/SettingsItem/types';
import Screen from '@/components/ui/Screen';
import { Advice } from '@/components/ui/Advice';

export default function IngredientsPage() {
  const router = useRouter();

  return (
    <Screen>
      <div className="flex flex-col justify-evenly min-h-[calc(100dvh-2rem)]">
        <div className="flex flex-col items-center justify-center gap-4">
          <Advice information="Los ingredientes y recetas no son editables por ahora." />
          <h1 className="text-primary text-2xl font-bold">Gestor de Ingredientes</h1>

          <SettingsItem
            label="Ver ingredientes"
            controlType={SettingsControlType.ARROW_ONLY}
            onPress={() => router.push('/ingredients/ingredients-list')}
          />
          <SettingsItem
            label="Añadir ingrediente"
            controlType={SettingsControlType.ARROW_ONLY}
            onPress={() => router.push('/ingredients/add-ingredient')}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 mt-8">
          <h2 className="text-primary text-2xl font-bold">Gestor de Recetas</h2>

          <SettingsItem
            label="Mis recetas"
            controlType={SettingsControlType.ARROW_ONLY}
            onPress={() => router.push('/ingredients/recipes-list')}
          />
          <SettingsItem
            label="Crear receta"
            controlType={SettingsControlType.ARROW_ONLY}
            onPress={() => router.push('/ingredients/add-recipe')}
          />
        </div>
      </div>
    </Screen>
  );
}
