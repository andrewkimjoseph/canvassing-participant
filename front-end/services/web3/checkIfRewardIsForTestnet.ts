import { RPCUrls } from '@/utils/rpcURLs/rpcUrls';
import { Address, createPublicClient, custom, http } from 'viem';
import { celoAlfajores, celo } from 'viem/chains';

export const checkIfRewardIsForTestnet = async ({
  _transactionHash,
}: CheckIfRewardIsForTestnetProps): Promise<boolean> => {
  let rewardIsForTestnet: boolean = false;

  try {
    const publicClient = createPublicClient({
      chain: celoAlfajores,
      transport: http(RPCUrls.celoAlfajores()),
    });

    const txnReceipt = await publicClient.getTransactionReceipt({
      hash: _transactionHash as Address,
    });

    rewardIsForTestnet = txnReceipt.status === 'success';

    return rewardIsForTestnet;
  } catch (error) {
    return rewardIsForTestnet;
  }
};

export type CheckIfRewardIsForTestnetProps = {
  _transactionHash: string;
};
