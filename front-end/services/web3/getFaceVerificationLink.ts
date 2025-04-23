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

// export const getFaceVerificationLink = async (
//   _chainId: number,
//   callbackLink: string
// ): Promise<string> => {
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

//   const link = await identitySDK.generateFVLink(false, callbackLink, _chainId);

//   return link;
// };
