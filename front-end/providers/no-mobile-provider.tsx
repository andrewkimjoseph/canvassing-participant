import React, { useState, useEffect } from "react";
import { Flex, Box } from "@chakra-ui/react";
import { SpinnerIconC } from "@/components/icons/spinner-icon";
import { useRouter } from "next/navigation";
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
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { isMiniPay } = useMiniPayStore(); // Get isMinipay status from the store

  useEffect(() => {
    // Check on initial mount if we need to redirect
    const checkEnvironment = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      
      // Redirect only if mobile AND not in MiniPay
      if (mobile && !isMiniPay) {
        router.push("/minipay-only");
      }
    };

    checkEnvironment();
    setMounted(true);
  }, [isMiniPay, router]);

  if (!mounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  // For non-mobile OR mobile devices inside MiniPay, render children
  if (!isMobile || (isMobile && isMiniPay)) {
    return <>{children}</>;
  }

  // For mobile devices not in MiniPay, show loading while redirecting
  return (
    <Box position="fixed" top="0" left="0" width="100%" height="100%" zIndex="999">
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    </Box>
  );
};

export default NoMobileProvider;
export { NoMobileProvider };