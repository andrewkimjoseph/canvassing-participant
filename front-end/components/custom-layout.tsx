import { FC, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Flex, Box } from "@chakra-ui/react";
import CustomHeader from "./custom-header";

interface Props {
  children: ReactNode;
}

const CustomLayout: FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const noHeaderRoutes = ["/welcome", "/welcome/sign-up"];
  const showHeader = !noHeaderRoutes.includes(pathname);

  return (
    <Flex
      bgColor={"#ECECEC"}
      flexDirection={"column"}
      minHeight="100vh"
      width="100%"
      maxWidth="100%"
      overflow="hidden"
    >
      {showHeader && <CustomHeader />}
      <Box
        width="100%"
        maxWidth="100%"
        flex="1"
        overflowY="auto"
        overflowX="hidden"
      >
        {children}
      </Box>
    </Flex>
  );
};

export default CustomLayout;
