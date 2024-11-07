import { expect } from "chai";
import {
    Address,
    createPublicClient,
    createWalletClient,
    http,
    parseEther,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { config } from "dotenv";

// Import your contract ABI and bytecode
import { abi } from "../artifacts/contracts/CanvassingSurvey.sol/CanvassingSurvey.json";
import { bytecode } from "../artifacts/contracts/CanvassingSurvey.sol/CanvassingSurvey.json";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD on Alfajores
const SRP = process.env.SRP;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

if (!SRP) throw new Error("SRP not found in environment variables");
if (!INFURA_API_KEY)
    throw new Error("INFURA_API_KEY not found in environment variables");

describe("CanvassingSurvey", () => {
    const publicClient = createPublicClient({
        chain: celoAlfajores,
        transport: http(INFURA_RPC_URL),
    });

    const mnemonicAccount = mnemonicToAccount(SRP);
    
    const privateClient = createWalletClient({
        account: mnemonicAccount,
        chain: celoAlfajores,
        transport: http(INFURA_RPC_URL),
    });

    let contractAddress: Address | null | undefined;

    before(async function () {
        const hash = await privateClient.deployContract({
            abi,
            account: mnemonicAccount,
            args: [
                mnemonicAccount.address,
                parseEther("1"), // 1 cUSD reward
                BigInt(100), // target participantsxq
                CUSD_ADDRESS,
            ],
            bytecode: bytecode as `0x${string}`,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        contractAddress = receipt.contractAddress;

        console.log(contractAddress);

        if (!contractAddress) throw new Error("Contract deployment failed");
      });

    it("Should whitelist an address", async () => {
        // Deploy the contract


        const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

        const [address] = await privateClient.getAddresses();

        const whitelistTx = await privateClient.writeContract({
            account: address,
            address: contractAddress as Address,
            abi: abi,
            functionName: "whitelistOneAddress",
            args: [testAddress],
        });

        await publicClient.waitForTransactionReceipt({
            hash: whitelistTx,
        });


        const isWhitelisted: boolean = (await publicClient.readContract({
            address: contractAddress as Address,
            abi: abi,
            functionName: "checkIfUserAddressIsWhitelisted",
            args: [testAddress],
        })) as boolean;

        // Check if address is whitelisted
        expect(isWhitelisted).to.be.true;
    });
});
