// import { closedSurveyV6ContractABI } from "@/utils/abis/closedSurveyV6ContractABI";
// import { IdentitySDK } from "@goodsdks/identity-sdk";
// import {
//   Address,
//   createPublicClient,
//   createWalletClient,
//   custom,
//   PublicClient,
//   WalletClient,
// } from "viem";
// import { celoAlfajores } from "viem/chains";
// import { celo } from "viem/chains";

// export const checkIfUserIsIdentified = async (
//   address: Address,
//   _chainId: number
// ): Promise<{ isWhitelisted: boolean; root: Address }> => {
//   if (!window.ethereum) {
//     return { isWhitelisted: false, root: `0x` };
//   }

//   const publicClient = createPublicClient({
//     chain: _chainId === celo.id ? celo : celoAlfajores,
//     transport: custom(window.ethereum),
//   });

//   const privateClient = createWalletClient({
//     chain: _chainId === celo.id ? celo : celoAlfajores,
//     transport: custom(window.ethereum),
//   });

//   const identitySDK = new IdentitySDK(
//     publicClient as any,
//     privateClient as WalletClient,
//     "production"
//   );

//   const link = await identitySDK.getWhitelistedRoot(address);

//   return link;
// };
