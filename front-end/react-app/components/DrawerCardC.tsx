'use client';

import { IconSvgProps } from '@/types/svgIcon';
import { Box, Text, Card, Icon, Link } from '@chakra-ui/react';

interface Props {
  SVGIcon: React.FC<IconSvgProps>;
  text: string;
  link: string;
}

export const DrawerCardC: React.FC<Props> = ({ SVGIcon, text, link }) => {
  return (
    <Link
      href={link}
      py={2}
    >
      <Box
        className="flex flex-row items-center justify-center"
        // m={2}
        my={1}
        rounded={'lg'}
      >
        <SVGIcon />
        <Text fontSize={20} pl={2} color={'white'}>
          {text}
        </Text>
      </Box>
    </Link>
  );
};
