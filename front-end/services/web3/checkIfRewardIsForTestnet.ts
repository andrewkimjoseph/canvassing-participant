import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const checkIfRewardIsForTestnet = async ({
  _transactionHash,
}: CheckIfRewardIsForTestnetProps): Promise<boolean> => {
  try {
    const publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: custom(window.ethereum),
    });

    const txnReceipt = await publicClient.getTransactionReceipt({
      hash: _transactionHash as Address,
    });

    return txnReceipt.status === 'success';
  } catch (error) {
    return false;
  }
};

export type CheckIfRewardIsForTestnetProps = {
  _transactionHash: string;
};
