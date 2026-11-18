import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mega Brain v2-3 | Hub Pessoal & Segundo Cérebro',
  description: 'Organização inteligente de links, mídias, pastas recursivas, tarefas e relatórios.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-md3-surface text-md3-onSurface">
        {children}
      </body>
    </html>
  );
}
