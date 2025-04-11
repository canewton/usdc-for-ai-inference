import './globals.css';

import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import Navbar from '@/components/Navbar';
import { NavbarAIDropdown } from '@/components/navbar-ai-dropdown';
import UserLastLoginProvider from '@/components/UserLastLoginProvider';
import { createClient } from '@/utils/supabase/server';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Next.js and Supabase Starter Kit',
  description: 'The fastest way to build apps with Next.js and Supabase',
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
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.data.user?.id)
    .single();

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <UserLastLoginProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <main className="h-screen flex flex-col overflow-auto">
              {profile.data.is_admin ? (
                <Navbar
                  tabs={['Website Analytics', 'Treasury Wallet']}
                  routes={['admin', 'admin/treasury-wallet']}
                  email={user.data.user?.email ?? ''}
                />
              ) : (
                <Navbar
                  tabs={['Manage Wallet', 'Build with AI']}
                  routes={['dashboard', 'chat']}
                  email={user.data.user?.email ?? ''}
                  dropdowns={{ 'Build with AI': <NavbarAIDropdown /> }}
                  dropdownRoutes={{
                    'Build with AI': [
                      'chat',
                      '3d',
                      'image',
                      'image-generator',
                      'video',
                    ],
                  }}
                />
              )}
              <div className="flex flex-col flex-1">{children}</div>
            </main>
          </ThemeProvider>
        </UserLastLoginProvider>
      </body>
    </html>
  );
}
