import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import { Address } from "viem";
import { vars } from "hardhat/config";

const PK_ONE = vars.get("PK_ONE");
const INFURA_API_KEY = vars.get("INFURA_API_KEY");

import * as dotenv from "dotenv";

dotenv.config();

if (!PK_ONE) throw new Error("PK_ONE not found in environment variables");
if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

const ALFAJORES_INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

const MAINNET_INFURA_RPC_URL = `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`;

const PK = `0x${process.env.PK_ONE}` as Address;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.29",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    celoAlfajores: {
      url: ALFAJORES_INFURA_RPC_URL,
      accounts: [PK],
      chainId: 44787,
    },
    celo: {
      url: MAINNET_INFURA_RPC_URL,
      accounts: [PK],
      chainId: 42220,
    },
  },
  sourcify: {
    enabled: true,
  },
  etherscan: {
    apiKey: {
      celoAlfajores: "no-api-key-needed",
      celo: "no-api-key-needed",
    },
    customChains: [
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://celo-alfajores.blockscout.com/api",
          browserURL: "https://celo-alfajores.blockscout.com",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://celo.blockscout.com/api",
          browserURL: "https://celo.blockscout.com",
        },
      },
    ],
  },
};

export default config;
