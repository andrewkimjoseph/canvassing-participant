import { FC, ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import CustomHeader from './custom-header';

interface Props {
  children: ReactNode;
}
const CustomLayout: FC<Props> = ({ children }) => {
  return (
    <>
      <div className="bg-white flex flex-col">
        <CustomHeader />
        <Box w={"100wh"}  >
          {children}
        </Box>
      </div>
    </>
  );
};

export default CustomLayout;
