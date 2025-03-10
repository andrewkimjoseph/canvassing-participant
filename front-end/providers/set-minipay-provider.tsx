import { SpinnerIconC } from "@/components/icons/spinner-icon";
import useMiniPayStore from "@/stores/useMiniPayStore";
import { Flex, Text } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

export const SetMiniPayProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);
  const { setIsMiniPay: setIsMiniPayInStore } = useMiniPayStore();
  useEffect(() => {
    const checkMiniPay = (): void => {
      const isPreviewOrDev =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          process.env.NEXT_PUBLIC_VERCEL_ENV === "preview");

      const miniPayExists: boolean =
        isPreviewOrDev ||
        (typeof window !== "undefined" &&
          (window as any).ethereum &&
          ((window as any).ethereum.isMiniPay !== undefined ||
            (window as any).ethereum.isMiniPay === true));

      setIsMiniPay(miniPayExists);
      setIsMiniPayInStore(miniPayExists);
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

  // if (isMiniPay === false || isMiniPay === undefined) {
  //   return (
  //     <Flex justify="center" align="center" minH="100vh">
  //       <Text fontSize={'md'} color="#363062" textAlign={'center'}>
  //         This dApp is only available on MiniPay on Opera Mini / Opera Mini
  //         Beta, or the MiniPay Standalone App
  //       </Text>
  //     </Flex>
  //   );
  // }

  // if (isMiniPay === true) {
  //   return <>{children}</>;
  // }

  return <>{children}</>;
};

export default SetMiniPayProvider;
