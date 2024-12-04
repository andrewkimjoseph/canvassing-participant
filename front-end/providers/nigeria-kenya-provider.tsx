import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Flex, Text } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';

export const NigeriaKenyaProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isAllowedCountry, setIsAllowedCountry] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const checkCountry = async () => {
      try {
        // Use geolocation API to get user's country
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        // Check if the country is Nigeria or Kenya
        const allowedCountries = ['NG', 'KE'];
        setIsAllowedCountry(allowedCountries.includes(data.country_code));
      } catch (error) {
        console.error('Error detecting country:', error);
        // Default to false if detection fails
        setIsAllowedCountry(false);
      }
    };

    // Check on initial mount
    checkCountry();
  }, []);

  // If not from Nigeria or Kenya, render centered message

  if (isAllowedCountry === null) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  if (isAllowedCountry === false) {
    return (
      <Flex
      justify="center"
      align="center"
      minH="100vh"
      >
        <Text fontSize={'md'} color="#363062" textAlign={"center"}>
          This dApp is not available in your country.
        </Text>
      </Flex>
    );
  }

  // Render children if from allowed countries
  return <>{children}</>;
};

export default NigeriaKenyaProvider;
