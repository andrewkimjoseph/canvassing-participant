// import { closedSurveyV3ContractABI } from '@/utils/abis/closedSurveyV3ContractABI';
// import { Address, createPublicClient, custom } from 'viem';
// import { celoAlfajores, celo } from 'viem/chains';

// export const checkIfParticipantIsWhitelisted = async (
//   _signerAddress: `0x${string}` | undefined,
//   {
//     _walletAddress,
//     _contractAddress,
//     _chainId,
//   }: CheckIfUserAddressIsWhitelistedProps
// ): Promise<boolean> => {
//   if (window.ethereum) {
//     try {
//       const publicClient = createPublicClient({
//         chain: _chainId === celo.id ? celo : celoAlfajores,
//         transport: custom(window.ethereum),
//       });
//       try {
//         const userIsWhitelisted = await publicClient.readContract({
//           address: _contractAddress,
//           abi: closedSurveyV3ContractABI,
//           functionName: 'checkIfParticipantIsWhitelisted',
//           args: [_walletAddress],
//         });
//         return userIsWhitelisted as boolean;
//       } catch (err) {
//         return false;
//       }
//     } catch (error) {
//       return false;
//     }
//   }
//   return false;
// };

// export type CheckIfUserAddressIsWhitelistedProps = {
//   _walletAddress: Address;
//   _contractAddress: Address;
//   _chainId: number;
// };
