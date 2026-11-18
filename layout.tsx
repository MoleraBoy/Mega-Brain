import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mega Brain v2.3 — Hub Pessoal & Segundo Cérebro',
  description: 'Organização recursiva, aprendizado contínuo, TNE, lembretes com som/vibração e cofre biométrico.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased selection:bg-md3-primaryContainer selection:text-md3-onPrimaryContainer">
        {children}
      </body>
    </html>
  );
}
