import { FC, ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import CustomHeader from './custom-header';

interface Props {
  children: ReactNode;
}
const CustomLayout: FC<Props> = ({ children }) => {
  return (
    <>
      <div className="bg-white overflow-hidden flex flex-col">
        <CustomHeader />
        <Box w={"100wh"} h={"100vh"} >
          {children}
        </Box>
      </div>
    </>
  );
};

export default CustomLayout;
