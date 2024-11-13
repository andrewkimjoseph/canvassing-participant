import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@chakra-ui/react';
import CustomHeader from './custom-header';
import useParticipantStore from '@/stores/useParticipantStore';

interface Props {
  children: ReactNode;
}

const CustomLayout: FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const { participant } = useParticipantStore();
  const noHeaderRoutes = ['/welcome', '/sign-up'];
  
  // Show header only if:
  // 1. Not on a no-header route AND
  // 2. Participant exists
  const showHeader = !noHeaderRoutes.includes(pathname) && !!participant;

  return (
    <div className="bg-white flex flex-col">
      {showHeader && <CustomHeader />}
      <Box w="100vw">
        {children}
      </Box>
    </div>
  );
};

export default CustomLayout;