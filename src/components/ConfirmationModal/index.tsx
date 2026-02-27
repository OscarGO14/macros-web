'use client';
import React, { useEffect, useRef } from 'react';
import ActionButton from '@/components/ui/ActionButton';
import { ConfirmationModalProps } from './types';

export default function ConfirmationModal({
  isVisible,
  onClose,
  handleConfirm,
  message,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isVisible) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isVisible]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className="backdrop:bg-black/80 bg-transparent w-full max-w-sm rounded-lg p-0"
    >
      <div className="bg-item-background rounded-lg p-5 flex flex-col gap-4 shadow-lg">
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
    </dialog>
  );
}
