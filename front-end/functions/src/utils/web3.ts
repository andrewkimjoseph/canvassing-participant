import { createWalletClient, Address, http, encodeFunctionData } from 'viem';
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

  try {
    const whitelistABI = [
      {
        inputs: [{ internalType: 'address', name: 'participantWalletAddress', type: 'address' }],
        name: 'whitelistParticipant',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ];

    const txnRqst = await privateClient.prepareTransactionRequest({
      account,
      data: encodeFunctionData({
        abi: whitelistABI,
        functionName: 'whitelistParticipant',
        args: [participantWalletAddress],
      }),
    });

    const serializedTxn = await privateClient.signTransaction({
      ...txnRqst,
      chain: config.chain,
    });
    
    const screenParticipantTxnHash = await privateClient.sendRawTransaction({
      serializedTransaction: serializedTxn,
    });

    return { success: true, txnHash: screenParticipantTxnHash };
  } catch (err) {
    return { success: false, txnHash: null };
  }
};
