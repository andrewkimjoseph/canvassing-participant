import React from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';

const YouAreSetCard: React.FC = () => {
  return (
    <Box
      h="229px"
      w="6/6"
      borderRadius={10}
      my={4}
      position="relative"
      bgColor="white"
    >
      <Flex
        flexDirection="column"
        alignItems="top"
        p={4}
        h="100%"
        justifyContent="space-around"
      >
        <Text
          fontSize="3xl"
          fontWeight="bold"
          color="#363062"
          textAlign="left"
        >
          You are set!
        </Text>
        <Box position="absolute" top={12} right={2}>
          <YouAreSetCard />
        </Box>
        <Text fontSize="12" color="#363062" textAlign="left" w={'4/6'}>
          Keep an eye out for surveys on Wednesday, Thursday, and Friday to
          earn rewards faster.
        </Text>
      </Flex>
    </Box>
  );
};

export default YouAreSetCard;