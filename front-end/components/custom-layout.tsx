import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import CustomHeader from './custom-header';

interface Props {
  children: ReactNode;
}

const CustomLayout: FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const noHeaderRoutes = ['/welcome', '/sign-up'];
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <div className="bg-white flex flex-col">
      {showHeader && <CustomHeader />}
      <Box w="100vw">{children}</Box>
    </div>
  );
};

export default CustomLayout;
