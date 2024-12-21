import { useContext } from 'react';
import { AmplitudeContext } from '@/providers/amplitude-provider';

const useAmplitudeContext = () => {
  const context = useContext(AmplitudeContext);
  
  if (!context) {
    throw new Error(
      'useAmplitudeContext must be used within an AmplitudeContextProvider'
    );
  }

  return context;
};

export default useAmplitudeContext;
