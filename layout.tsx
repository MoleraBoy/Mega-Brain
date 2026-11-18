import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mega Brain — Segundo Cérebro & Hub Pessoal',
  description: 'Gestão inteligente de links, mídias, pastas recursivas, tarefas com TNE, histórico real e espaço privado.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-md3-surface text-md3-onSurface antialiased">
        {children}
      </body>
    </html>
  );
}
