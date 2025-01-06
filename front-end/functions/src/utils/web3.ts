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

  // const publicClient = createPublicClient({
  //   chain: config.chain,
  //   transport: http(config.rpcUrl),
  // });

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


    const txnRqst = await privateClient.prepareTransactionRequest({
      account,
      data: encodeFunctionData({
        abi: whitelistABI,
        functionName: 'whitelistParticipant',
        args: [participantWalletAddress],
      }),
    });

    const serializedWhitelistParticipantTxn = await privateClient.signTransaction({
      ...txnRqst,
      chain: config.chain,
    });
    
    const serializedWhitelistParticipantTxnHash = await privateClient.sendRawTransaction({
      serializedTransaction: serializedWhitelistParticipantTxn,
    });


    // const { request: whitelistParticipantRqst } =
    //   await publicClient.simulateContract({
    //     account,
    //     address: surveyContractAddress as Address,
    //     abi: whitelistABI,
    //     functionName: 'whitelistParticipant',
    //     args: [participantWalletAddress],
    //   });

    //   privateClient

    // const whitelistParticipantRqstTxnHash = await privateClient.writeContract(
    //   whitelistParticipantRqst
    // );

    console.log('Whitelisting successful, at hash:', serializedWhitelistParticipantTxnHash);

    return { success: true, txnHash: serializedWhitelistParticipantTxnHash };
  } catch (err) {
    console.error(err);
    return { success: false, txnHash: null };
  }
};
