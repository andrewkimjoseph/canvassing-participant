// 'use client';

// import { Box } from '@chakra-ui/react';
// import { AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot } from '@/components/ui/accordion';
// import { useState } from 'react';


// interface AccordionItemData {
//   value: string;
//   title: string;
//   text: string;
// }

// interface AccordionBoxProps {
//   items: AccordionItemData[];
//   value: string[];
//  onValueChange?: (value: string[]) => void;
// }

// const AccordionBox: React.FC<AccordionBoxProps> = ({ items, value, onValueChange}) => {

//     const [theValue, setTheValue] = useState(["survey-instructions"])
//   return (
//     <Box
//       bgColor="white"
//       h="25"
//       borderRadius={10}
//       flexDirection="column"
//       pb={2}
//       mb={2}
//       pt={1}
//       mx={2}
//       px={2}
//       py={2}
//       justifyContent="center"
//     >
//       <AccordionRoot value={value}   onValueChange={(e) => setTheValue(items.indexOf())}>
//         {items.map((item, index) => (
//           <AccordionItem key={index} value={item.value} color="black" pb={1}>
//             <AccordionItemTrigger fontWeight="bold">{item.title}</AccordionItemTrigger>
//             <AccordionItemContent>{item.text}</AccordionItemContent>
//           </AccordionItem>
//         ))}
//       </AccordionRoot>
//     </Box>
//   );
// };

// export default AccordionBox;