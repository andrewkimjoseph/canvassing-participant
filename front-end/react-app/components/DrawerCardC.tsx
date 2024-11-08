'use client';

import { FC } from 'react';
import Link from 'next/link';
import { IconSvgProps } from '@/types/svgIcon';
import { Box, Text, Card, Icon } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

interface Props {
  SVGIcon: React.FC<IconSvgProps>;
  text: string;
  link: string;
}

export const DrawerCardC: React.FC<Props> = ({ SVGIcon, text, link }) => {
  const router = useRouter();

  return (
    <Link href={link}>
      <Box w={'full'} className="flex flex-col" mt={1}>
        <Card.Root
          variant={'outline'}
          borderRadius={12}
          w={'full'}
          bgColor={'#363062'}
        >
          <Card.Body p={2}>
            <Box
              w={'full'}
              className="flex flex-row items-center justify-between"
            >
              <Box className="flex flex-row items-center justify-center">
                <SVGIcon />
                <Text fontSize={20} color="white" pl={2}>
                  {text}
                </Text>
              </Box>
            </Box>
          </Card.Body>
        </Card.Root>
      </Box>
    </Link>
  );
};
