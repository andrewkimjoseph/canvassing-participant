'use client';
import { useEffect, createContext } from 'react';
import { init, track } from '@amplitude/analytics-browser';

const NEXT_PUBLIC_AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

// Define the shape of the context value
interface AmplitudeContextType {
  trackAmplitudeEvent: (eventName: string, eventProperties: {}) => void;
}

export const AmplitudeContext = createContext<AmplitudeContextType | undefined>(
  undefined // Initially set to undefined to ensure proper error handling
);

const AmplitudeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useEffect(() => {
    init(NEXT_PUBLIC_AMPLITUDE_API_KEY as string, { autocapture: true });
  }, []);

  const trackAmplitudeEvent = (eventName: string, eventProperties: {}) => {
    track(eventName, eventProperties);
  };

  const value: AmplitudeContextType = { trackAmplitudeEvent };

  return (
    <AmplitudeContext.Provider value={value}>
      {children}
    </AmplitudeContext.Provider>
  );
};

export default AmplitudeContextProvider;
