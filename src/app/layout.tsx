import type { Metadata, Viewport } from 'next';
import ClientLayout from '@/components/ClientLayout';
import MyToast from '@/components/MyToast';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Macros Comida',
  description: 'Seguimiento de macros y calorías',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Macros',
  },
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
