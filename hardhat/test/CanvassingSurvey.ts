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
    const currentNonce = await publicClient.getTransactionCount({
        address: mnemonicAccount.address,
        blockTag:'latest'
      });

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
      nonce: currentNonce
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    contractAddress = receipt.contractAddress;

    console.log(contractAddress);

    if (!contractAddress) throw new Error("Contract deployment failed");
  });

  it("Should whitelist an address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    const whitelistTx = await privateClient.writeContract({
      account: mnemonicAccount,
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

  it("Should blacklist a whitelisted address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    const blacklistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "blacklistOneWhitelistedAddress",
      args: [testAddress],
    });

    await publicClient.waitForTransactionReceipt({
      hash: blacklistTx,
    });

    const isWhitelisted: boolean = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "checkIfUserAddressIsWhitelisted",
      args: [testAddress],
    })) as boolean;

    const isBlacklisted: boolean = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "checkIfUserAddressIsBlacklisted",
      args: [testAddress],
    })) as boolean;

    // Check if address is blacklisted
    expect(isWhitelisted).to.be.false;
    expect(isBlacklisted).to.be.true;
  });

  it("Should whitelist multiple addresses", async () => {
    const testAddresses = [
      "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A",
      "0x123456789012345678901234567890123456789A",
      "0x987654321098765432109876543210987654321B",
    ];

    const [address] = await privateClient.getAddresses();

    const whitelistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "whitelistMultipleAddresses",
      args: [testAddresses],
    });

    await publicClient.waitForTransactionReceipt({
      hash: whitelistTx,
    });

    const whitelistedAddresses = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "getWhitelistedAddressesFromRegisteredAddresses",
      args: [testAddresses],
    })) as Address[];

    // Check if all addresses are whitelisted
    expect(whitelistedAddresses.length).to.equal(testAddresses.length);
    for (const address of testAddresses) {
      expect(whitelistedAddresses).to.include(address);
    }
  });

  it("Should blacklist multiple whitelisted addresses", async () => {
    const testAddresses = [
      "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A",
      "0x123456789012345678901234567890123456789A",
      "0x987654321098765432109876543210987654321B",
    ];

    const [address] = await privateClient.getAddresses();

    // Whitelist the addresses first
    await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "whitelistMultipleAddresses",
      args: [testAddresses],
    });

    const blacklistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "blacklistMultipleWhitelistedAddresses",
      args: [testAddresses],
    });

    await publicClient.waitForTransactionReceipt({
      hash: blacklistTx,
    });

    const whitelistedAddresses = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "getWhitelistedAddressesFromRegisteredAddresses",
      args: [testAddresses],
    })) as Address[];

    // Check if all addresses are blacklisted
    expect(whitelistedAddresses.length).to.equal(0);
  });

  it("Should allow a whitelisted participant to claim a reward", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    const rewardClaimTx = await privateClient.writeContract({
      account: testAddress,
      address: contractAddress as Address,
      abi: abi,
      functionName: "processRewardClaimByParticipant",
      args: [testAddress],
    });

    await publicClient.waitForTransactionReceipt({
      hash: rewardClaimTx,
    });

    const hasClaimedReward = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "checkIfParticipantHasAlreadyClaimedReward",
      args: [testAddress],
    })) as boolean;

    // Check if the participant has claimed the reward
    expect(hasClaimedReward).to.be.true;
  });

  it("Should not allow a blacklisted participant to claim a reward", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    const [address] = await privateClient.getAddresses();

    // Blacklist the address
    await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "blacklistOneWhitelistedAddress",
      args: [testAddress],
    });

    // Try to claim the reward
    await expect(
      privateClient.writeContract({
        account: testAddress,
        address: contractAddress as Address,
        abi: abi,
        functionName: "processRewardClaimByParticipant",
        args: [testAddress],
      })
    ).to.be.rejectedWith("UserAddressNotWhitelisted");
  });

  it("Should update the reward amount", async () => {
    const oldRewardAmount = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "getRewardAmountPerParticipantInWei",
    })) as number;

    const newRewardAmount = parseEther("2"); // 2 cUSD

    const updateTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "updateRewardAmountPerParticipant",
      args: [newRewardAmount],
    });

    await publicClient.waitForTransactionReceipt({
      hash: updateTx,
    });

    const currentRewardAmount = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "getRewardAmountPerParticipantInWei",
    })) as number;

    expect(currentRewardAmount).to.equal(newRewardAmount);
    expect(currentRewardAmount).to.not.equal(oldRewardAmount);
  });

  it("Should update the target number of participants", async () => {
    const [address] = await privateClient.getAddresses();

    const oldTargetParticipants = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "targetNumberOfParticipants",
    })) as number;

    const newTargetParticipants = 200;

    const updateTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "updateTargetNumberOfParticipants",
      args: [newTargetParticipants],
    });

    await publicClient.waitForTransactionReceipt({
      hash: updateTx,
    });

    const currentTargetParticipants = (await publicClient.readContract({
      address: contractAddress as Address,
      abi: abi,
      functionName: "targetNumberOfParticipants",
    })) as number;

    // Check if the target number of participants was updated
    expect(currentTargetParticipants).to.equal(newTargetParticipants);
    expect(currentTargetParticipants).to.not.equal(oldTargetParticipants);
  });
});
