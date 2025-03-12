"use client";

import { useState } from "react";
import { Button, Text, Flex } from "@chakra-ui/react";
import useAmplitudeContext from "@/hooks/useAmplitudeContext";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useRouter } from "next/navigation";

export default function MiniPayOnlyPage() {
  const { trackAmplitudeEvent } = useAmplitudeContext();
  const [showModal, setShowModal] = useState(true);
  const minipayInviteLink0xA38 = "https://invite.minipay.xyz/fs4Wxzv4QYqxJuzq8";
  const router = useRouter();

  const handleOpenMiniPay = () => {
    trackAmplitudeEvent("Go to MiniPay clicked", {});
    router.replace(minipayInviteLink0xA38);
  };

  return (
    <Flex flexDirection="column" w="100%" h="100vh" bgColor="#ECECEC">
      <Modal
        backdrop="blur"
        isOpen={showModal} // This should be true
        onClose={() => {}} // Empty function as we don't want users to close this
        isDismissable={false} // Prevent dismissing by clicking backdrop
        isKeyboardDismissDisabled={true} // Prevent dismissing with keyboard
        placement="center" // Ensure modal is centered
        className="flex items-center justify-center" // Additional centering classes
      >
        <ModalContent className="w-1/2 max-w-md mx-auto my-auto">
          <>
            <ModalHeader className="flex flex-col gap-1">Oops</ModalHeader>
            <ModalBody>
              <Text fontSize="13" color="black" textAlign={"center"}>
                You can only open this app inside MiniPay.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                bgColor="#363062"
                borderRadius={15}
                px={6}
                w="full"
                onClick={handleOpenMiniPay}
              >
                <Text
                  fontSize="16"
                  fontWeight="bold"
                  color="white"
                  textAlign={"center"}
                >
                  Go to MiniPay
                </Text>
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
