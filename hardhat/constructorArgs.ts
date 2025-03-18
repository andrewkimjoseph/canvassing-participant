import { Address, parseEther } from "viem";


const constructorArgs: [Address, BigInt, BigInt, Address] = [
  "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A",
  parseEther("0.05"),
  BigInt(5),
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
];

export default constructorArgs;
