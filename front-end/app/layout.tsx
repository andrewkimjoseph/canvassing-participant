import '@/styles/globals.css';
import { AppProvider } from '@/providers/app-provider';
import { Provider } from '@/components/ui/provider';
import { Metadata } from 'next';
import { font } from '@/utils/font';
import amplitude from '@amplitude/analytics-browser';
import AmplitudeContextProvider from '@/providers/amplitude-provider';

export const metadata: Metadata = {
  title: 'Canvassing - Participant',
  description: 'opinions pay, today',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.dmSans.className} suppressHydrationWarning>
      <body>
      <AmplitudeContextProvider>
        <Provider>
          <AppProvider>
            {children}
          </AppProvider>
        </Provider>
        </AmplitudeContextProvider>
      </body>
    </html>
  );
}
