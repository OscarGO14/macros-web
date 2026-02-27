import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import MyToast from '@/components/MyToast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Macros Comida',
  description: 'Seguimiento de macros y calorías',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-background text-primary antialiased">
        <ClientLayout>{children}</ClientLayout>
        <MyToast />
      </body>
    </html>
  );
}
