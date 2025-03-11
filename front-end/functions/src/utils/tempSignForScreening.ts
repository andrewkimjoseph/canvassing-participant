import {
  createWalletClient,
  Address,
  http,
  keccak256,
  encodePacked,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS } from '../config/config';
import { TempSignForScreeningProps, TempSignForClaimingResult } from '../types/types';
import { randomBytes } from 'crypto';

const PK = `0x${process.env.PK}` as Address;

/**
 * Generates a signature for participant screening in a survey.
 *
 * @param {Object} params - The parameters for signing the screening request.
 * @param {string} params.surveyContractAddress - The address of the survey contract.
 * @param {number} params.chainId - The ID of the blockchain network.
 * @param {string} params.participantWalletAddress - The wallet address of the participant.
 * @param {string} params.surveyId - The ID of the survey.
 * @param {string} params.network - The network name.
 * @returns {Promise<TempSignForClaimingResult>} A promise that resolves to the result of the signing operation.
 *
 * @typedef {Object} TempSignForScreeningProps
 * @property {string} surveyContractAddress - The address of the survey contract.
 * @property {number} chainId - The ID of the blockchain network.
 * @property {string} participantWalletAddress - The wallet address of the participant.
 * @property {string} surveyId - The ID of the survey.
 * @property {string} network - The network name.
 *
 * @typedef {Object} TempSignForClaimingResult
 * @property {boolean} success - Indicates if the signing was successful.
 * @property {string | null} signature - The signature of the message, or null if unsuccessful.
 * @property {string} nonce - The nonce used in the signing process.
 */
export const tempSignForScreening = async ({
  surveyContractAddress,
  chainId,
  participantWalletAddress,
  surveyId,
  network,
}: TempSignForScreeningProps): Promise<TempSignForClaimingResult> => {
  try {
    const config = CHAIN_CONFIGS[network];
    const account = privateKeyToAccount(PK);

    const privateClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    const nonce = BigInt('0x' + randomBytes(32).toString('hex'));

    const [types, data] = [
      ['address', 'uint256', 'address', 'string', 'uint256'],
      [
        surveyContractAddress,
        chainId,
        participantWalletAddress,
        surveyId,
        nonce,
      ],
    ];

    const messageHash = keccak256(encodePacked(types, data), 'bytes');

    const signature = await privateClient.signMessage({
      message: {
        raw: messageHash,
      },
    });

    const stringifiedNonce = nonce.toString();

    console.log('Signing successful, signature:', signature);
    console.log('Nonce:', stringifiedNonce);

    return { success: true, signature: signature, nonce: stringifiedNonce };
  } catch (err) {
    console.error(err);
    return { success: false, signature: null, nonce: '' };
  }
};