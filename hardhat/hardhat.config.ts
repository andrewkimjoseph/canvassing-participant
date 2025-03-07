import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import { mnemonicToAccount } from "viem/accounts";
import { toHex } from "viem";
import { vars } from "hardhat/config";

const SRP = vars.get("SRP");
const INFURA_API_KEY = vars.get("INFURA_API_KEY");

import * as dotenv from "dotenv";

// Configure dotenv to load the .env file
dotenv.config();


if (!SRP) throw new Error("SRP not found in environment variables");
if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

const PRIVATE_KEY = toHex(mnemonicToAccount(SRP).getHdKey().privateKey as Uint8Array);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    celoAlfajores: {
      url: INFURA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 44787,
    }
  },
  sourcify: {
    enabled: true
  },
  etherscan: {
    apiKey: {
      celoAlfajores: "no-api-key-needed"
    },
    customChains: [
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://celo-alfajores.blockscout.com/api",
          browserURL: "https://celo-alfajores.blockscout.com"
        }
      }
    ]
  },
};

export default config;