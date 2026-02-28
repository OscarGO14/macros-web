'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { auth, usersCollection } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import { defaultGoals } from '@/types/goals';
import { IUserStateData } from '@/types/user';
import InputText from '@/components/ui/InputText';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setError } = useUserStore();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      toast.error('Por favor, rellena todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const initialUserData: IUserStateData = {
        uid: user.uid,
        email: user.email,
        displayName: user.email?.split('@')[0] || '',
        dailyGoals: defaultGoals,
        history: {},
      };

      await setDoc(doc(usersCollection, user.uid), initialUserData);
    } catch (error) {
      let errorMessage = 'Ha ocurrido un error inesperado durante el registro.';
      if (error instanceof FirebaseError || error instanceof Error) {
        errorMessage = (error as Error).message;
      }
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-4">
          <h1 className="mb-8 text-3xl font-bold text-primary">Crear Cuenta</h1>

          <div className="w-full flex flex-col gap-4 p-4">
            <InputText
              label="Email"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <InputText
              label="Contraseña"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <InputText
              label="Confirmar Contraseña"
              placeholder="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {loading ? (
              <p className="text-center text-alternate">Cargando...</p>
            ) : (
              <SubmitButton label="Registrarse" onPress={handleRegister} />
            )}
          </div>

          <Link href="/auth/login" replace className="mt-6 text-alternate hover:text-primary">
            ¿Ya tienes cuenta? Inicia Sesión
          </Link>
        </div>
      </div>
    </Screen>
  );
}
