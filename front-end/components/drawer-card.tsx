'use client';

import { IconSvgProps } from '@/types/svgIcon';
import { Box, Text, Link } from '@chakra-ui/react';

interface Props {
  SVGIcon: React.FC<IconSvgProps>;
  text: string;
  link: string;
  onClick?: () => void; // Optional onClick callback
}

export const DrawerCardC: React.FC<Props> = ({ SVGIcon, text, link, onClick }) => {
  return (
    <Link
      href={link}
      py={2}
      onClick={onClick} // Attach the onClick callback here
    >
      <Box
        className="flex flex-row items-center justify-center"
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
