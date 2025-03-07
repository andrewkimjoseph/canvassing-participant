'use client';

import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  AccordionRoot,
} from '@/components/ui/accordion';
import { primaryColor } from '@/utils/colors/colors';
import { Box } from '@chakra-ui/react';

interface AccordionComponentProps {
  title: string;
  content: React.ReactNode;
  value?: string;
}

const CustomAccordion: React.FC<AccordionComponentProps> = ({
  title,
  content,
}) => {
  return (
    <Box
      bgColor="white"
      h="25"
      borderRadius={10}
      flexDirection="column"
      pb={2}
      mb={2}
      pt={1}
      mx={2}
      px={2}
      py={2}
      justifyContent="center"
    >
      <AccordionRoot multiple>
        <AccordionItem value="faq-questions" color="black" pb={1}>
          <AccordionItemTrigger fontWeight="bold">{title}</AccordionItemTrigger>
          <AccordionItemContent>
            <hr
              style={{
                backgroundColor: primaryColor,
                height: 3,
                borderRadius: 4,
              }}
            />

            {content}
          </AccordionItemContent>
        </AccordionItem>
      </AccordionRoot>
    </Box>
  );
};

export default CustomAccordion;
