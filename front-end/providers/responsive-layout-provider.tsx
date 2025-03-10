// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Flex, Text } from '@chakra-ui/react';
// import { SpinnerIconC } from '@/components/icons/spinner-icon';

// // Function to detect mobile devices
// const isMobileDevice = () => {
//   if (typeof window === 'undefined') return false;

//   const userAgent = window.navigator.userAgent.toLowerCase();
//   const mobileKeywords = [
//     'android',
//     'webos',
//     'iphone',
//     'ipad',
//     'ipod',
//     'blackberry',
//     'windows phone',
//   ];

//   // Check user agent and screen width
//   return (
//     mobileKeywords.some((keyword) => userAgent.includes(keyword)) &&
//     window.innerWidth <= 700
//   );
// };

// interface MobileOnlyProviderProps {
//   children: React.ReactNode;
//   redirectPath?: string;
// }

// export const MobileOnlyProvider: React.FC<MobileOnlyProviderProps> = ({
//   children,
//   redirectPath = '/',
// }) => {
//   const [isMobile, setIsMobile] = useState<boolean | null>(
//     null
//   );
//   const router = useRouter();

//   useEffect(() => {
//     // Check if it's a mobile device
//     const checkMobile = () => {
//       const mobile = isMobileDevice();
//       setIsMobile(mobile);

//       // Redirect if not on mobile
//       if (!mobile) {
//         router.push(redirectPath);
//       }
//     };

//     // Check on initial mount
//     checkMobile();

//     // Optional: recheck on window resize
//     window.addEventListener('resize', checkMobile);

//     // Cleanup event listener
//     return () => {
//       window.removeEventListener('resize', checkMobile);
//     };
//   }, [router, redirectPath]);


//   if (isMobile === null) {
//     return (
//       <Flex justify="center" align="center" minH="100vh">
//         <SpinnerIconC />
//       </Flex>
//     );
//   }

//   // Only render children if on mobile
//   if (isMobile === false) {
//     return (
//       <Flex
//         justify="center"
//         align="center"
//         minH="100vh"
//       >
//         <Text fontSize={'md'} color="#363062" textAlign={"center"}>
//           This dApp is only available on mobile devices (small screens)
//         </Text>
//       </Flex>
//     );
//   }

//   return <>{children}</>;
// };

// export default MobileOnlyProvider;

import React, { useState, useEffect } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Spinner } from "@heroui/spinner";

// Configuration options for the layout
interface ResponsiveLayoutConfig {
  maxMobileWidth: number;
  maxContentWidth: number;
  mobileBackgroundColor?: string;
  desktopBackgroundColor?: string;
  showMobileBorder?: boolean;
}

// Default configuration
const defaultConfig: ResponsiveLayoutConfig = {
  maxMobileWidth: 480,
  maxContentWidth: 480,
  mobileBackgroundColor: "transparent",
  desktopBackgroundColor: "#f5f5f5",
  showMobileBorder: true,
};

interface ResponsiveLayoutProviderProps {
  children: React.ReactNode;
  config?: Partial<ResponsiveLayoutConfig>;
}

const ResponsiveLayoutProvider: React.FC<ResponsiveLayoutProviderProps> = ({
  children,
  config = {},
}) => {
  // Merge default config with user provided config
  const fullConfig = { ...defaultConfig, ...config };

  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(true); // Default to true to prevent flash
  const [mounted, setMounted] = useState(false);

  // Check if device is mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= fullConfig.maxMobileWidth);
    };

    // Set initial value
    checkIfMobile();

    // Mark as mounted
    setMounted(true);

    // Add event listener for resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [fullConfig.maxMobileWidth]);

  // Don't render anything until after initial mount
  if (!mounted)
    return (
      <Flex
        // ref={flexRef}
        justifyContent={"center"}
        alignItems={"center"}
        flexDirection={"column"}
        h={"100vh"}
      >
        <Spinner size="sm" />
      </Flex>
    );

  if (isMobile) {
    // On mobile, render normally with full width
    return <>{children}</>;
  }

  // On desktop, center the content and limit the width
  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      bg={fullConfig.desktopBackgroundColor}
    >
      <Box
        width="100%"
        maxWidth={`${fullConfig.maxContentWidth}px`}
        height="100%"
        overflowY="auto"
        bg="white"
        position="relative"
      >
        {children}
      </Box>
    </Box>
  );
};

export default ResponsiveLayoutProvider;
export { ResponsiveLayoutProvider };
