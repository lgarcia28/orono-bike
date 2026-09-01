import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';
import { FloatingActions } from '@/app/components/ui/FloatingActions';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Oroño Bike — Tienda de Ciclismo de Alto Rendimiento & Taller Especializado | Rosario',
  description:
    'Bicicletería de alto rendimiento y taller mecánico especializado en Rosario. Specialized, Cannondale, Trek, Scott, Shimano, SRAM. Envíos a todo el país y retiro en local.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col font-sans bg-white text-zinc-900 antialiased selection:bg-zinc-950 selection:text-white">
        {children}
        <FloatingActions />
      </body>
    </html>
  );
}
