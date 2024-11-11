import { FC, ReactNode } from 'react';
import Header from './Header';
import { Box } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}
const Layout: FC<Props> = ({ children }) => {
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

export default Layout;


// className="max-w-7xl mx-auto space-y-8 sm:px-6 lg:px-8"