import '@/styles/globals.css';
import { Web3Provider } from '@/providers/app-provider';
import { Provider } from '@/components/ui/provider';
import { Metadata } from 'next';
import { font } from '@/utils/font';
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
            <Web3Provider>{children}</Web3Provider>
          </Provider>
        </AmplitudeContextProvider>
      </body>
    </html>
  );
}
