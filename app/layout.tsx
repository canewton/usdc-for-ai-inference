import './globals.css';

import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

const defaultUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Circle AI Inference Billing',
  description: 'Metered AI Inference Billing with USDC via Circle APIs',
};

const geistSans = Geist({
  display: 'swap',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Defaulting to light theme as per original
          enableSystem={false} // Explicitly disable system theme if you want light/dark only
          disableTransitionOnChange
        >
          <main className="h-screen flex flex-col overflow-auto">
            <div className="flex flex-col flex-1">{children}</div>
          </main>
          {/* Add Sonner Toaster for notifications */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
