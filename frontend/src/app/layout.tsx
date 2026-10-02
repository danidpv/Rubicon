import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/layout/providers';
export const metadata: Metadata = { title: 'SP Local IA · Supuestos prácticos', description: 'Aprende a resolver supuestos prácticos de Policía Local en Andalucía.' };
export const dynamic = 'force-dynamic';
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body><Providers>{children}</Providers></body></html>; }
