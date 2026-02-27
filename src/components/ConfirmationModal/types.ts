export interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  handleConfirm: () => void | Promise<void>;
  message: string;
}
