"use client";

import {
  Box,
  Flex,
  Link,
  IconButton,
  Circle,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerActionTrigger,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  Text,
  DrawerTrigger,
} from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogoC } from "./logo";
import { HamburgerIconC } from "./hamburger-icon";
import { DrawerCardC } from "./drawer-card";
import { HomeIconC } from "./icons/home-icon";
import { RewardHistoryIconC } from "./icons/reward-history-icon";
import useParticipantStore from "@/stores/useParticipantStore";
import { useState, useEffect } from "react";
import { injected } from "wagmi/connectors";
import { useAccount, useConnect } from "wagmi";
import useAmplitudeContext from "@/hooks/useAmplitudeContext";
import { MoreIconC } from "./icons/more-icon";
import { MaleAvatarC } from "./avatars/male-avatar";
import { FemaleAvatarC } from "./avatars/female-avatar";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase";
import { AnonUserIconC } from "./icons/checkmarks/anon-user";
import { CanvassingUserIconC } from "./icons/checkmarks/canvassing-user";
import useMiniPayStore from "@/stores/useMiniPayStore";

const CustomHeader = () => {
  const { participant } = useParticipantStore();
  const [mounted, setMounted] = useState(false);
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const { trackAmplitudeEvent } = useAmplitudeContext();
  const [user, setUser] = useState<User | null>(null);
  const { isMiniPay, isMiniPayContext } = useMiniPayStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMiniPay && !isConnected) {
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, [isMiniPay, isConnected, connect]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Box position="relative" width="100%" maxWidth="100%">
      <DrawerRoot size={"full"} placement={"start"}>
        <DrawerBackdrop
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
          }}
        />
        {/* Fixed header */}
        <Box
          bg="#363062"
          px={4}
          position="fixed"
          top="0"
          left="0"
          right="0"
          zIndex="999"
          width="100%"
          boxShadow="0 2px 4px rgba(0,0,0,0.1)"
        >
          <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
            <DrawerTrigger
              asChild
              onClick={() => {
                trackAmplitudeEvent("Hamburger Icon clicked", {
                  participantWalletAddress: participant?.walletAddress,
                  participantId: participant?.id,
                });
              }}
            >
              <IconButton size={"md"} aria-label={"Open Menu"}>
                <HamburgerIconC />
              </IconButton>
            </DrawerTrigger>

            <Link
              onClick={(e) => {
                e.preventDefault();
                trackAmplitudeEvent("Canvassing Logo clicked", {
                  participantWalletAddress: participant?.walletAddress,
                  participantId: participant?.id,
                });
                window.location.replace("/");
              }}
            >
              <LogoC />
            </Link>

            {mounted ? (
              <Circle
                size="10px"
                bgColor={isConnected ? "green.500" : "red.500"}
              />
            ) : (
              <Box w="10px" h="10px" /> // Placeholder with same dimensions
            )}
          </Flex>
        </Box>

        {/* Add a spacer to prevent content from being hidden under the fixed header */}
        <Box height="64px" width="100%" />

        <DrawerContent
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "70vw",
            maxWidth: "min(70vw, 280px)",
            backgroundColor: "#363062",
            zIndex: 1001,
            overflowY: "auto",
          }}
        >
          <DrawerHeader>
            <Flex
              flexDirection={"row"}
              alignItems={"start"}
              justify={"space-between"}
              pt={3}
            >
              <Box className="flex flex-row items-left w-full">
                {participant?.gender === "M" ? (
                  <MaleAvatarC />
                ) : (
                  <FemaleAvatarC />
                )}

                <Box className="flex flex-col items-left relative ml-4">
                  <Box className="flex flex-row items-left w-full" mb={2}>
                    <Text fontSize={18} color={"white"} mr={2}>
                      {participant?.username || "Userxxxx"}
                    </Text>

                    {user && (
                      <>
                        {user.isAnonymous ? (
                          <AnonUserIconC />
                        ) : user.emailVerified ? (
                          <CanvassingUserIconC />
                        ) : null}
                      </>
                    )}
                  </Box>

                  <Text fontSize={14} mb={2} color={"white"}>
                    Participant
                  </Text>

                  <Text fontSize={14} mb={2} color={"#94B9FF"}>
                    {participant?.walletAddress?.slice(0, 6) + "..."}
                  </Text>
                </Box>
              </Box>
            </Flex>
          </DrawerHeader>
          <DrawerBody>
            <hr
              style={{
                backgroundColor: "D9D9D9",
                height: 2,
                borderRadius: 4,
                borderWidth: 2,
              }}
            />

            <Flex flexDirection={"column"} alignItems={"start"}>
              <DrawerActionTrigger>
                <DrawerCardC
                  SVGIcon={HomeIconC}
                  text={"Home"}
                  link={"/"}
                  onClick={() => {
                    trackAmplitudeEvent("Home clicked", {
                      participantWalletAddress: participant?.walletAddress,
                      participantId: participant?.id,
                    });
                  }}
                />
              </DrawerActionTrigger>
              <DrawerActionTrigger>
                <DrawerCardC
                  SVGIcon={RewardHistoryIconC}
                  text={"Reward History"}
                  link={"/reward-history"}
                  onClick={() => {
                    trackAmplitudeEvent("Reward History clicked", {
                      participantWalletAddress: participant?.walletAddress,
                      participantId: participant?.id,
                    });
                  }}
                />
              </DrawerActionTrigger>
              <DrawerActionTrigger>
                <DrawerCardC
                  SVGIcon={MoreIconC}
                  text={"More"}
                  link={"/more"}
                  onClick={() => {
                    trackAmplitudeEvent("More clicked", {
                      participantWalletAddress: participant?.walletAddress,
                      participantId: participant?.id,
                    });
                  }}
                />
              </DrawerActionTrigger>
            </Flex>
          </DrawerBody>
          <DrawerFooter flexDirection={"column"} alignItems={"center"}>
            <hr
              style={{
                backgroundColor: "D9D9D9",
                height: 2,
                borderRadius: 4,
                borderWidth: 2,
                width: "100%",
              }}
            />

            {!isMiniPayContext ? (
              <ConnectButton
                chainStatus="none"
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "avatar",
                }}
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
                label="Connect Wallet"
              />
            ) : null}

            <Box className="flex flex-row items-left w-full mb-4">
              <Box className="flex flex-col items-left relative">
                <Text
                  fontSize={12}
                  color={"#94B9FF"}
                  mt={8}
                  lineHeight={"short"}
                  textAlign={"center"}
                >
                  This decentralized application (dApp) is independently
                  operated and maintained by Canvassing. It is not affiliated
                  with, endorsed by, or operated by Opera or MiniPay, Mento, or
                  GoodDollar.
                </Text>
              </Box>
            </Box>
          </DrawerFooter>
          <DrawerCloseTrigger />
        </DrawerContent>
      </DrawerRoot>
    </Box>
  );
};

export default CustomHeader;
