import "@/styles/globals.css";
import { Web3Provider } from "@/providers/web-3-provider";
import { UIProvider } from "@/components/ui/provider";
import { Metadata } from "next";
import { font } from "@/utils/font";
import AmplitudeContextProvider from "@/providers/amplitude-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Canvassing - Participant",
  description: "opinions pay, today",
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
          <UIProvider>
            <Web3Provider>
              {children}
              <SpeedInsights />
            </Web3Provider>
          </UIProvider>
        </AmplitudeContextProvider>
      </body>
    </html>
  );
}
