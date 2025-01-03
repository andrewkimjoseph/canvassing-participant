import { celo, celoAlfajores } from 'viem/chains';

export interface ChainConfig {
  chain: typeof celo | typeof celoAlfajores;
  rpcUrl: string;
}

const dRPCAPIKey = process.env.DRPC_API_KEY;

export const CHAIN_CONFIGS: Record<'mainnet' | 'testnet', ChainConfig> = {
  mainnet: {
    chain: celo,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=celo&dkey=${dRPCAPIKey}`
  },
  testnet: {
    chain: celoAlfajores,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=celo-alfajores&dkey=${dRPCAPIKey}`
  }
};
