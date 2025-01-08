import { celo, celoAlfajores } from 'viem/chains';

export interface ChainConfig {
  chain: typeof celo | typeof celoAlfajores;
  rpcUrl: string;
  id: number
}

const dRPCAPIKey = process.env.DRPC_API_KEY;

export const CHAIN_CONFIGS: Record<'mainnet' | 'testnet', ChainConfig> = {
  mainnet: {
    chain: celo,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=celo&dkey=${dRPCAPIKey}`,
    id: 42220,
  },
  testnet: {
    chain: celoAlfajores,
    rpcUrl: `https://lb.drpc.org/ogrpc?network=celo-alfajores&dkey=${dRPCAPIKey}`,
    id: 44787
  }
};
