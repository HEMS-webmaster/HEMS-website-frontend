import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HEMS Workshop Manager | Local Workbench',
  description: 'Internal operational console for HEMS proceedings curation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
