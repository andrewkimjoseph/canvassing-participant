import { Address, createPublicClient, custom } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const checkIfRewardIsForTestnet = async ({
  _transactionHash,
  _chainId,
}: CheckIfRewardIsForTestnetProps): Promise<boolean> => {
  try {
    const publicClient = createPublicClient({
      chain: _chainId === celo.id ? celo : celoAlfajores,
      transport: custom(window.ethereum),
    });

    const txnReceipt = await publicClient.getTransactionReceipt({
      hash: _transactionHash as Address,
    });

    return txnReceipt.status == 'success';
  } catch (error) {
    return false;
  }
};

export type CheckIfRewardIsForTestnetProps = {
  _transactionHash: string;
  _chainId: number;
};
