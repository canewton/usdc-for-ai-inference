// app/layout.tsx
import './globals.css';

import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner'; // Import Sonner Toaster

import Navbar from '@/components/Navbar'; // Corrected path
import { createClient } from '@/utils/supabase/server';
import type { Profile } from '@/types/database.types'; // Assuming types/database.types.ts exists

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Codelab Circle AI Billing',
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
  const supabase = await createClient(); // Use server client from utils

  // Fetch user session server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data only if user exists
  let profile: Profile | null = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    profile = profileData;
  }

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
             {/* Pass user and profile (which can be null) to Navbar */}
             <Navbar user={user} profile={profile} />
            <div className="flex flex-col flex-1">{children}</div>
          </main>
          {/* Add Sonner Toaster for notifications */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}