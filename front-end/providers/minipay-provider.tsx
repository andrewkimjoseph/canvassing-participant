import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Flex, Text } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';

export const MiniPayProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isMiniPay, setIsMiniPay] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMiniPay = () => {
      const miniPayExists =
        window.ethereum &&
        (window.ethereum.isMiniPay || window.ethereum.isMinipay)
          ? true
          : false;

      setIsMiniPay(miniPayExists);
    };

    checkMiniPay();
  }, []);

  if (isMiniPay === null) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  if (isMiniPay === false) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Text fontSize={'md'} color="#363062" textAlign={'center'}>
          This dApp is only available on MiniPay on Opera Mini / Opera Mini
          Beta, or the MiniPay Standalone App
        </Text>
      </Flex>
    );
  }

  return <>{children}</>;
};

export default MiniPayProvider;
