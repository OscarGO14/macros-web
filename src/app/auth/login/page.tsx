'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';
import { auth } from '@/services/firebase';
import { useUserStore } from '@/store/userStore';
import InputText from '@/components/ui/InputText';
import Screen from '@/components/ui/Screen';
import SubmitButton from '@/components/ui/SubmitButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setError } = useUserStore();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Por favor, introduce tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      let errorMessage = 'Ha ocurrido un error inesperado.';
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
      <div className="flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <div className="w-full max-w-md flex flex-col gap-4">
          <h1 className="mb-8 text-3xl font-bold text-primary">Iniciar Sesión</h1>

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

            {loading ? (
              <p className="text-center text-alternate">Cargando...</p>
            ) : (
              <SubmitButton label="Iniciar Sesión" onPress={handleLogin} />
            )}
          </div>

          <Link href="/auth/register" replace className="mt-6 text-alternate hover:text-primary">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    </Screen>
  );
}
