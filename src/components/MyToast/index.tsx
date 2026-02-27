'use client';
import { Toaster } from 'sonner';
import { MyColors } from '@/types/colors';

export default function MyToast() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: MyColors.ITEM_BACKGROUND,
          color: MyColors.PRIMARY,
          border: `1px solid ${MyColors.ALTERNATE}`,
        },
        classNames: {
          error: 'border-danger!',
          success: 'border-accent!',
        },
      }}
    />
  );
}
