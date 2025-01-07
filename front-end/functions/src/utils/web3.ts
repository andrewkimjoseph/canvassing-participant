import { createWalletClient, Address, http, keccak256, encodePacked } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../config/config';
import { WhitelistParticipantProps, WhitelistParticipantResult } from '../types/types';
import * as admin from 'firebase-admin';

const SRP = process.env.SRP as Address;

export const signForReward = async (
{participantWalletAddress, rewardId, network}: WhitelistParticipantProps
): Promise<WhitelistParticipantResult> => {
  try {
    const config = CHAIN_CONFIGS[network];
    const account = mnemonicToAccount(SRP);

    const privateClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const nonce = admin.firestore.FieldValue.serverTimestamp();

    const [types, data] = [
      ['address', 'string', 'uint256'],
      [participantWalletAddress, rewardId, nonce],
    ];

    const messageHash = keccak256(encodePacked(types, data), 'bytes');

    const signature = await privateClient.signMessage({
      message: {
        raw: messageHash,
      },
    });
    
    console.log('Signing successful:', signature);

    return { success: true, signature: signature }
  } catch (err) {
    console.error(err);
    return { success: false, signature: null };
  }
}



