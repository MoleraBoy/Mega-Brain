import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mega Brain v2.2 — Hub Pessoal & Segundo Cérebro',
  description: 'Organização recursiva de conhecimento, links, tarefas TNE, relatórios e cofre biométrico.'
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
