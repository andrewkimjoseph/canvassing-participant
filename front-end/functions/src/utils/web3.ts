import { createWalletClient, Address, http, keccak256, encodePacked } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../config/config';
import { SignForRewardProps, SignForRewardResult } from '../types/types';
import { randomBytes } from 'crypto';

const SRP = process.env.SRP as Address;

export const signForReward = async (
{surveyContractAddress, chainId,  participantWalletAddress, rewardId, network}: SignForRewardProps
): Promise<SignForRewardResult> => {
  try {
    const config = CHAIN_CONFIGS[network];
    const account = mnemonicToAccount(SRP);

    const privateClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const nonce = BigInt('0x' + randomBytes(32).toString('hex'));

    const [types, data] = [
      ['address', 'uint256', 'address', 'string', 'uint256'],
      [surveyContractAddress, chainId, participantWalletAddress, rewardId, nonce],
  ];


    const messageHash = keccak256(encodePacked(types, data), 'bytes');

    const signature = await privateClient.signMessage({
      message: {
        raw: messageHash,
      },
    });

    const stringifiedNonce = nonce.toString();
    
    console.log('Signing successful:', signature);

    return { success: true, signature: signature, nonce: stringifiedNonce }
  } catch (err) {
    console.error(err);
    return { success: false, signature: null, nonce: '' };
  }
}



