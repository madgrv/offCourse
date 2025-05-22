import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Teo's offCourse",
  description: 'A diet tracking application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/*
            Do not render Navigation here. Navigation and dashboard shell are provided by DashboardLayout for authenticated sections.
            This allows public pages (login, signup, etc) to be rendered without dashboard chrome.
          */}
          <main className='min-h-screen pt-6'>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
