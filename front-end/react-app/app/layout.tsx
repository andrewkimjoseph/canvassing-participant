import '@/styles/globals.css';

import { AppProvider } from '@/providers/AppProvider';
import { Provider } from '@/components/ui/provider';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Canvassing',
  description: 'opinions pay, today'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <AppProvider>{children}</AppProvider>{' '}
        </Provider>
      </body>
    </html>
  );
}
