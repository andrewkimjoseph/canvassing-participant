import React, { useState, useEffect } from 'react';

export const MiniPayProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    const checkMiniPay = () => {
      // Check for MiniPay in window.ethereum
      const miniPayDetected = 
        typeof window !== 'undefined' && 
        window.ethereum && 
        (window.ethereum.isMiniPay || window.ethereum.isMinipay);
      
      setIsMiniPay(!!miniPayDetected);
    };

    // Check on initial mount
    checkMiniPay();
  }, []);

  // If not MiniPay, render null
  if (!isMiniPay) {
    return null;
  }

  // Render children if MiniPay is detected
  return <>{children}</>;
};

export default MiniPayProvider;