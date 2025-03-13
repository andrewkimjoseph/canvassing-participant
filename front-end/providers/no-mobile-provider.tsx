import React, { useState, useEffect } from "react";
import { Flex } from "@chakra-ui/react";
import { SpinnerIconC } from "@/components/icons/spinner-icon";
import useMiniPayStore from "@/stores/useMiniPayStore";

// Function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];

  // Check if it's a mobile device
  return mobileKeywords.some((keyword) => userAgent.includes(keyword));
};

interface NoMobileProviderProps {
  children: React.ReactNode;
}

const NoMobileProvider: React.FC<NoMobileProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const { isMiniPay } = useMiniPayStore();

  useEffect(() => {
    // First, check if we're already on the minipay-only page to prevent loops
    const isAlreadyOnMinipayOnlyPage = 
      typeof window !== "undefined" && 
      (window.location.pathname === "/minipay-only" || 
       window.location.pathname.includes("/minipay-only"));
    
    // Only run once on initial mount and only if not already on the target page
    if (!mounted && !isAlreadyOnMinipayOnlyPage) {
      const mobile = isMobileDevice();
      
      // Redirect only if mobile AND not in MiniPay
      if (mobile && !isMiniPay) {
        // Use window.location for a hard redirect instead of router
        window.location.href = "/minipay-only";
        return; // Don't set mounted to true if redirecting
      }
    }
    
    // Always set mounted to true after checks
    setMounted(true);
  }, [isMiniPay, mounted]);

  // Show spinner while checking or if not mounted yet
  if (!mounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  // If we get here, render children
  return <>{children}</>;
};

export default NoMobileProvider;
export { NoMobileProvider };