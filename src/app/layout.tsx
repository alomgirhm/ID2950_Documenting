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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}

