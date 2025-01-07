import { createWalletClient, Address, http, keccak256, encodePacked } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../config/config';
import { SignForRewardProps, SignForRewardResult } from '../types/types';
import { randomBytes } from 'crypto';

const SRP = process.env.SRP as Address;

export const signForReward = async (
{participantWalletAddress, rewardId, network}: SignForRewardProps
): Promise<SignForRewardResult> => {
  try {
    const config = CHAIN_CONFIGS[network];
    const account = mnemonicToAccount(SRP);

    const privateClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const nonce = BigInt('0x' + randomBytes(32).toString('hex')).toString();

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

    return { success: true, signature: signature, nonce: nonce }
  } catch (err) {
    console.error(err);
    return { success: false, signature: null, nonce: '' };
  }
}



