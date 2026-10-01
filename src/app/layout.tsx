import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ID2950_Documenting | Daily Productivity & Learning System',
  description: 'Document your whole day, track time blocks, book reading, coding, and self-development projects with high focus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

