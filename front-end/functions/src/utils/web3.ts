import { createWalletClient, Address, http, createPublicClient } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../config/config';
import { WhitelistParticipantResult } from '../types/types';

const SRP = process.env.SRP as Address;

export const whitelistParticipant = async (
  surveyContractAddress: string,
  participantWalletAddress: string,
  network: 'mainnet' | 'testnet'
): Promise<WhitelistParticipantResult> => {
  const config = CHAIN_CONFIGS[network];
  const account = mnemonicToAccount(SRP);

  const privateClient = createWalletClient({
    account,
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  try {
    const whitelistABI = [
      {
        inputs: [
          {
            internalType: 'address',
            name: 'participantWalletAddress',
            type: 'address',
          },
        ],
        name: 'whitelistParticipant',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    const { request: whitelistParticipantRqst } =
      await publicClient.simulateContract({
        account,
        address: surveyContractAddress as Address,
        abi: whitelistABI,
        functionName: 'whitelistParticipant',
        args: [participantWalletAddress],
      });

    const whitelistParticipantRqstTxnHash = await privateClient.writeContract(
      whitelistParticipantRqst
    );

    console.log('Transaction successful, at hash:', whitelistParticipantRqstTxnHash);

    return { success: true, txnHash: whitelistParticipantRqstTxnHash };
  } catch (err) {
    console.error(err);
    return { success: false, txnHash: null };
  }
};
