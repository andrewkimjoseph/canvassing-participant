'use client';

import { IconSvgProps } from '@/types/svgIcon';
import { Box, Text, Link } from '@chakra-ui/react';

interface Props {
  SVGIcon: React.FC<IconSvgProps>;
  primaryText: string;
  secondaryText: string;

  link: string;
  onClick?: () => void; // Optional onClick callback
}

export const MoreOptionsCard: React.FC<Props> = ({
  SVGIcon,
  primaryText,
  secondaryText,
  link,
  onClick,
}) => {
  return (
    <Link
      href={link}
      py={1}
      onClick={onClick} // Attach the onClick callback here
    >
      <Box
        className="flex flex-row items-center"
        my={2}
        pl={3}
        rounded={'lg'}
        bgColor={'white'}
        w={'100vw'}
      >
        <SVGIcon />

        <Box className="flex flex-col " rounded={'lg'} p={4}>
          <Text fontSize={18} pl={2} color={'black'} fontWeight={'semibold'}>
            {primaryText}
          </Text>

          <Text fontSize={14} pl={2} color={'grey'}>
            {secondaryText}
          </Text>
        </Box>
      </Box>
    </Link>
  );
};
