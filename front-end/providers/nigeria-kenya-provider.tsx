// import { SpinnerIconC } from '@/components/icons/spinner-icon';
// import { Flex, Text } from '@chakra-ui/react';
// import React, { useState, useEffect } from 'react';

// export const NigeriaKenyaProvider: React.FC<{
//   children: React.ReactNode;
// }> = ({ children }) => {
//   const [isAllowedCountry, setIsAllowedCountry] = useState<boolean | null>(
//     null
//   );

//   useEffect(() => {
//     const checkCountry = async () => {
//       try {
//         const response = await fetch('https://ipapi.co/json/');
//         const data = await response.json();

//         // const allowedCountries = ['NG', 'KE'];
//         const allowedCountries = ['KE'];

//         setIsAllowedCountry(allowedCountries.includes(data.country_code));
//       } catch (error) {
//         setIsAllowedCountry(false);
//       }
//     };

//     checkCountry();
//   }, []);

//   if (isAllowedCountry === null) {
//     return (
//       <Flex justify="center" align="center" minH="100%">
//         <SpinnerIconC />
//       </Flex>
//     );
//   }

//   if (isAllowedCountry === false) {
//     return (
//       <Flex justify="center" align="center" minH="100%">
//         <Text fontSize={'md'} color="#363062" textAlign={'center'}>
//           This dApp is not available in your country.
//         </Text>
//       </Flex>
//     );
//   }

//   // Render children if from allowed countries
//   return <>{children}</>;
// };

// export default NigeriaKenyaProvider;
