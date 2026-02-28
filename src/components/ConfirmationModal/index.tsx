'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import ActionButton from '@/components/ui/ActionButton';
import { ConfirmationModalProps } from './types';

export default function ConfirmationModal({
  isVisible,
  onClose,
  handleConfirm,
  message,
}: ConfirmationModalProps) {
  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className="relative w-full bg-item-background rounded-t-2xl shadow-lg p-5 flex flex-col gap-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-primary text-base font-bold">{message}</p>
        <ActionButton
          color="accent"
          label="Confirmar"
          onPress={() => {
            handleConfirm();
            onClose();
          }}
        />
        <ActionButton color="primary" label="Cancelar" onPress={onClose} />
      </div>
    </div>,
    document.body
  );
}
