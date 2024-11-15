import { canvassingSurveyContractABI } from '@/utils/abis/canvassingSurveyContractABI';
import { Address, createPublicClient, createWalletClient, custom } from 'viem';
import { celoAlfajores } from 'viem/chains';

export const processRewardClaimByParticipant = async (
  _signerAddress: `0x${string}` | undefined,
  {
    _smartContractAddress: smartContractAddress,
    _participantWalletAddress: participantWalletAddress,
  }: ProcessRewardClaimByParticipantProps
): Promise<boolean> => {
  if (window.ethereum) {
    const privateClient = createWalletClient({
      chain: celoAlfajores,
      transport: custom(window.ethereum),
    });
    const publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: custom(window.ethereum),
    });
    const [address] = await privateClient.getAddresses();
    try {
      const createDonationAccountTxnHash = await privateClient.writeContract({
        account: address,
        address: smartContractAddress,
        abi: canvassingSurveyContractABI,
        functionName: 'processRewardClaimByParticipant',
        args: [participantWalletAddress],
      });

      const createDonationTxnReceipt =
        await publicClient.waitForTransactionReceipt({
          hash: createDonationAccountTxnHash,
        });

      if (createDonationTxnReceipt.status == 'success') {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  return false;
};
export type ProcessRewardClaimByParticipantProps = {
  _smartContractAddress: Address;
  _participantWalletAddress: Address;
};
