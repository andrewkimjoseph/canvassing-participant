import { FC, ReactNode } from 'react';
import Header from './header';
import { Box } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}
const CustomLayout: FC<Props> = ({ children }) => {
  return (
    <>
      <div className="bg-white overflow-hidden flex flex-col">
        <Header />
        <Box w={"100wh"} h={"100vh"} >
          {children}
        </Box>
      </div>
    </>
  );
};

export default CustomLayout;
