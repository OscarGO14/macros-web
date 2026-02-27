'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdDarkMode, MdPerson, MdLogout, MdDelete } from 'react-icons/md';
import { auth, deleteUser } from '@/services/firebase';
import SettingsItem from '@/components/ui/SettingsItem';
import { SettingsControlType } from '@/components/ui/SettingsItem/types';
import Screen from '@/components/ui/Screen';
import { handleLogout } from '@/utils/handleLogout';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useUserStore } from '@/store/userStore';

export default function SettingsPage() {
  const router = useRouter();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { clearUser } = useUserStore();

  const handleDeleteUser = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteUser(user.uid);
      clearUser();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      if (error instanceof Error && error.message === 'auth/requires-recent-login') {
        router.replace('/auth/login');
      }
    } finally {
      setShowConfirmationModal(false);
    }
  };

  return (
    <Screen>
      <div className="w-full flex flex-col gap-4 mt-6">
        <SettingsItem
          label="Modo Oscuro"
          controlType={SettingsControlType.SWITCH}
          value={true}
          onPress={() => {}}
          icon={<MdDarkMode size={24} />}
        />
        <SettingsItem
          label="Actualizar información de usuario"
          controlType={SettingsControlType.ARROW_ONLY}
          onPress={() => router.push('/settings/updateUser')}
          icon={<MdPerson size={24} />}
        />
        <SettingsItem
          label="Cerrar sesión"
          controlType={SettingsControlType.ARROW_ONLY}
          onPress={() => setShowLogoutModal(true)}
          icon={<MdLogout size={24} />}
        />
        <SettingsItem
          label="Eliminar usuario"
          controlType={SettingsControlType.ARROW_ONLY}
          onPress={() => setShowConfirmationModal(true)}
          icon={<MdDelete size={24} />}
        />

        <ConfirmationModal
          isVisible={showConfirmationModal}
          handleConfirm={handleDeleteUser}
          onClose={() => setShowConfirmationModal(false)}
          message="¿Estás seguro de que quieres eliminar tu cuenta?"
        />
        <ConfirmationModal
          isVisible={showLogoutModal}
          handleConfirm={handleLogout}
          onClose={() => setShowLogoutModal(false)}
          message="¿Estás seguro de que quieres cerrar sesión?"
        />
      </div>
    </Screen>
  );
}
