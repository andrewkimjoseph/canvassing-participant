import { SpinnerIconC } from "@/components/icons/spinner-icon";
import useMiniPayStore from "@/stores/useMiniPayStore";
import { Flex, Text } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";

export const SetMiniPayProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);
  const { setIsMiniPay: setIsMiniPayInStore, setIsMiniPayContext } =
    useMiniPayStore();
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

      const isMiniPayContext: boolean =
        typeof window !== "undefined" &&
        (window as any).ethereum &&
        ((window as any).ethereum.isMiniPay !== undefined ||
          (window as any).ethereum.isMiniPay === true);

      setIsMiniPay(miniPayExists);
      setIsMiniPayInStore(miniPayExists);
      setIsMiniPayContext(isMiniPayContext);
    };

    checkMiniPay();
  }, []);

  if (isMiniPay === null) {
    return (
      <Flex justify="center" align="center" minH="100%">
        <SpinnerIconC />
      </Flex>
    );
  }

  return <>{children}</>;
};

export default SetMiniPayProvider;
