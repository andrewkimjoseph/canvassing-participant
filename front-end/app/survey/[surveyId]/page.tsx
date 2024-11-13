'use client';

import { useEffect, useState } from 'react';

import { useAccount } from 'wagmi';

import { Box, Image, Button, VStack, Text, Flex, Separator } from '@chakra-ui/react';
import { useRouter } from 'next/navigation'

import {  AccordionItem,
    AccordionItemContent,
    AccordionItemTrigger,
    AccordionRoot } from '@/components/ui/accordion';
export default function SurveyPage() {
  const [userAddress, setUserAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();

  const router = useRouter();

  const [value, setValue] = useState(["survey-instructions"])


  const firstItem = [
    { value: "survey-instructions", title: "Survey instructions", text: "✅Select your primary stablecoin." },

  ]


  const secondItem = [
    { value: "time-duration", title: "Time Duration", text: "Estimated Completion Time: 2–3 minutes" },

  ]


  const thirdItem = [

    { value: "researcher", title: "Researcher", text: "MiniPay" },
  ]

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setUserAddress(address);
    }
  }, [address, isConnected]);

  if (!isMounted) {
    return null;
  }

  return (
    <Flex
      flexDirection={'column'}
      w={'100%'}
      h={"100vh"}
      bgColor={'#ECECEC'}
    >
      <Box
        width="100%"
        height={300}
        bgColor={"#CEDDF9"}
        borderBottomLeftRadius={15}
        borderBottomRightRadius={15}
      >
        <Image
          src="/instructional-manual.png" // Replace with your image URL
          alt="Background"
          width="100%"
          height={300}
          objectFit={"contain"}
          blur={'md'}
        />
      </Box>
      <Box
        bgColor="white"
        h="25"
        borderRadius={10}
        flexDirection={'column'}
        pb={2}
        mb={4}
        mt={2}
        pt={1}
        mx={2}
        justifyContent={"center"}

      >
        <Box bgColor="white" h="30" borderRadius={10} >
          <Flex flexDirection="column" alignItems="top" pl={2} pt={2} mt={1}>
            <Text fontSize={'lg'} mb={2} color="#363062">
              Understanding Stablecoin Usage in Africa
            </Text>

            <Text fontSize={'sm'} mb={2} color="black">
            Please share your experiences with stablecoins. Indicate how you use them, what motivates you to use them, and any challenges you encounter in this emerging market.
            </Text>
          </Flex>
        </Box>
        <Flex
          flexDirection="row"
          pl={2}
          pt={2}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Text fontSize={'lg'} color="green">
            $015
          </Text>
        </Flex>
      </Box>

      <Box
        bgColor="white"
        h="25"
        borderRadius={10}
        flexDirection={'column'}
        pb={2}
        mb={2}
        pt={1}
        mx={2}
        px={2}
        py={2}
        justifyContent={"center"}

      >
      <AccordionRoot value={value} onValueChange={(e) => setValue(e.value)} multiple>
        {firstItem.map((item, index) => (
          <AccordionItem key={index} value={item.value} color={"black"} pb={1}>
            <AccordionItemTrigger fontWeight={"bold"}>{item.title}</AccordionItemTrigger>
            <AccordionItemContent>{item.text}</AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
      </Box>

      <Box
         bgColor="white"
         h="25"
         borderRadius={10}
         flexDirection={'column'}
         pb={2}
         mb={2}
         pt={1}
         mx={2}
         px={2}
         py={2}
         justifyContent={"center"}

      >
      <AccordionRoot value={value} onValueChange={(e) => setValue(e.value)} multiple>
        {secondItem.map((item, index) => (
          <AccordionItem key={index} value={item.value} color={"black"} pb={1}>
            <AccordionItemTrigger fontWeight={"bold"}>{item.title}</AccordionItemTrigger>
            <AccordionItemContent>{item.text}</AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
      </Box>


      <Box
        bgColor="white"
        h="25"
        borderRadius={10}
        flexDirection={'column'}
        pb={2}
        mb={2}
        pt={1}
        mx={2}
        px={2}
        py={2}
        justifyContent={"center"}

      >
      <AccordionRoot value={value} onValueChange={(e) => setValue(e.value)} multiple>
        {thirdItem.map((item, index) => (
          <AccordionItem key={index} value={item.value} color={"black"} pb={1}>
     
            <AccordionItemTrigger fontWeight={"bold"}>{item.title}</AccordionItemTrigger>
            <AccordionItemContent>{item.text}</AccordionItemContent>
          </AccordionItem>
        ))}
      </AccordionRoot>
      </Box>
      <Button bgColor={"#363062"} borderRadius={15} px={6} w={"3/6"} mt={16} alignSelf={"center"} onClick={()=>router.push("https://tally.so/r/w2bjZV")}>
        <Text fontSize="16" fontWeight="bold" color="white">
        Start Survey
      </Text>
      </Button>
    </Flex>
  );
}
