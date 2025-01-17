'use client';
import { useEffect, createContext } from 'react';
import { init, track, identify, Identify } from '@amplitude/analytics-browser';

const NEXT_PUBLIC_AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

// Define the shape of the context value
interface AmplitudeContextType {
  trackAmplitudeEvent: (eventName: string, eventProperties: {}) => void;
  identifyUser: (identifyObj: Identify) => void;
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
    init(NEXT_PUBLIC_AMPLITUDE_API_KEY as string, {
      autocapture: {
        elementInteractions: false,
        fileDownloads: false,
        formInteractions: false,
        attribution: true,
        pageViews: true,
        sessions: true,
      },
    });
  }, []);

  const trackAmplitudeEvent = (eventName: string, eventProperties: {}) => {
    track(eventName, eventProperties);
  };

  const identifyUser = (identifyObj: Identify) => {
    identify(identifyObj);
  };

  const value: AmplitudeContextType = { trackAmplitudeEvent, identifyUser };

  return (
    <AmplitudeContext.Provider value={value}>
      {children}
    </AmplitudeContext.Provider>
  );
};

export default AmplitudeContextProvider;
