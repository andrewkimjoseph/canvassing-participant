import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Text } from '@chakra-ui/react';
import { SpinnerIconC } from '@/components/icons/spinner-icon';

// Function to detect mobile devices
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
  ];

  // Check user agent and screen width
  return (
    mobileKeywords.some((keyword) => userAgent.includes(keyword)) &&
    window.innerWidth <= 700
  );
};

interface MobileOnlyProviderProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export const MobileOnlyProvider: React.FC<MobileOnlyProviderProps> = ({
  children,
  redirectPath = '/',
}) => {
  const [isMobile, setIsMobile] = useState<boolean | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    // Check if it's a mobile device
    const checkMobile = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);

      // Redirect if not on mobile
      if (!mobile) {
        router.push(redirectPath);
      }
    };

    // Check on initial mount
    checkMobile();

    // Optional: recheck on window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup event listener
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [router, redirectPath]);


  if (isMobile === null) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  // Only render children if on mobile
  if (isMobile === false) {
    return (
      <Flex
        justify="center"
        align="center"
        minH="100vh"
      >
        <Text fontSize={'md'} color="#363062" textAlign={"center"}>
          This dApp is only available on mobile devices (small screens)
        </Text>
      </Flex>
    );
  }

  return <>{children}</>;
};

export default MobileOnlyProvider;
