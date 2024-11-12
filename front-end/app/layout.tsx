import '@/styles/globals.css';

import { AppProvider } from '@/providers/app-provider';
import { Provider } from '@/components/ui/provider';
import { Metadata } from 'next';
import { font } from "@/utils/font";

export const metadata: Metadata = {
  title: 'Canvassing - Participant',
  description: 'opinions pay, today'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.dmSans.className} suppressHydrationWarning>
      <body>
        <Provider>
          <AppProvider>{children}</AppProvider>
        </Provider>
      </body>
    </html>
  );
}
