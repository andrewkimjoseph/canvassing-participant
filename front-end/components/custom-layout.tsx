import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Flex, Box } from '@chakra-ui/react';
import CustomHeader from './custom-header';

interface Props {
  children: ReactNode;
}

const CustomLayout: FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const noHeaderRoutes = ['/welcome', '/welcome/sign-up'];
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <Flex bgColor={"#ECECEC"} flexDirection={"column"} minHeight="100vh">
      {showHeader && <CustomHeader />}
      <Box w="100vw" flex="1">{children}</Box>
    </Flex>
  );
};

export default CustomLayout;
