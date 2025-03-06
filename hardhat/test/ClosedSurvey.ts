import { expect } from "chai";
import {
  Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseEther,
  toHex,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { config } from "dotenv";

import { abi } from "../artifacts/contracts/ClosedSurveyV2.sol/ClosedSurveyV2.json";
import { bytecode } from "../artifacts/contracts/ClosedSurveyV2.sol/ClosedSurveyV2.json";
import { cUSDAlfajoresContractABI } from "./utils/cUSDAlfajoresContractABI";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const SRP = process.env.SRP;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

if (!SRP) throw new Error("SRP not found in environment variables");
if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

describe("Closed Survey", () => {
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
        parseEther("0.25"),
        BigInt(1),
        CUSD_ADDRESS,
      ],
      bytecode: bytecode as Address,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    contractAddress = receipt.contractAddress;

    console.log("Deployed contract address: ", contractAddress);

    if (!contractAddress) throw new Error("Contract deployment failed");
  });

  it("Should whitelist an address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    const whitelistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "whitelistOneUserAddress",
      args: [testAddress],
    });

    await publicClient.waitForTransactionReceipt({
      hash: whitelistTx,
    });

    const isWhitelisted = await checkIfUserAddressIsWhitelisted(
      publicClient,
      contractAddress as Address,
      abi,
      testAddress
    );
    const currentWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    // Check if address is whitelisted and the whitelisted count has increased
    expect(isWhitelisted).to.be.true;
    expect(currentWhitelistedCount).to.equal(initialWhitelistedCount + 1);
  });

  it("Should blacklist a whitelisted address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    const blacklistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "blacklistOneWhitelistedUserAddress",
      args: [testAddress],
    });

    await publicClient.waitForTransactionReceipt({
      hash: blacklistTx,
    });

    const isWhitelisted = await checkIfUserAddressIsWhitelisted(
      publicClient,
      contractAddress as Address,
      abi,
      testAddress
    );
    const isBlacklisted = await checkIfUserAddressIsBlacklisted(
      publicClient,
      contractAddress as Address,
      abi,
      testAddress
    );
    const currentWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    // Check if address is blacklisted and the whitelisted count has decreased
    expect(isWhitelisted).to.be.false;
    expect(isBlacklisted).to.be.true;
    expect(currentWhitelistedCount).to.equal(initialWhitelistedCount - 1);
  });

  it("Should whitelist multiple addresses", async () => {
    const testAddresses: Address[] = [
      "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A",
      "0x6dce6E80b113607bABf97041A0C8C5ACCC4d1a4e",
      "0xdaB7EB2409fdD974CF93357C61aEA141729AEfF5",
    ];

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    const whitelistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "whitelistMultipleUserAddresses",
      args: [testAddresses],
    });

    await publicClient.waitForTransactionReceipt({
      hash: whitelistTx,
    });

    const whitelistedAddresses =
      await getWhitelistedAddressesFromRegisteredAddresses(
        publicClient,
        contractAddress as Address,
        abi,
        testAddresses
      );
    const currentWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    // Check if all addresses are whitelisted and the whitelisted count has increased
    expect(whitelistedAddresses.length).to.equal(testAddresses.length);
    for (const address of testAddresses) {
      expect(whitelistedAddresses).to.include(address);
    }
    expect(currentWhitelistedCount).to.equal(
      initialWhitelistedCount + testAddresses.length
    );
  });

  it("Should blacklist multiple whitelisted addresses", async () => {
    const testAddresses: Address[] = [
      "0x6dce6E80b113607bABf97041A0C8C5ACCC4d1a4e",
      "0xdaB7EB2409fdD974CF93357C61aEA141729AEfF5",
    ];

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    const blacklistTx = await privateClient.writeContract({
      account: mnemonicAccount,
      address: contractAddress as Address,
      abi: abi,
      functionName: "blacklistMultipleWhitelistedUserAddresses",
      args: [testAddresses],
    });

    await publicClient.waitForTransactionReceipt({
      hash: blacklistTx,
    });

    const whitelistedAddresses =
      await getWhitelistedAddressesFromRegisteredAddresses(
        publicClient,
        contractAddress as Address,
        abi,
        testAddresses
      );
    const currentWhitelistedCount = await getNumberOfWhitelistedUserAddresses(
      publicClient,
      contractAddress as Address,
      abi
    );

    // Check if all addresses are blacklisted and the whitelisted count has decreased
    expect(whitelistedAddresses.length).to.equal(0);
    expect(currentWhitelistedCount).to.equal(
      initialWhitelistedCount - testAddresses.length
    );
  });

  it("Should update the target number of participants", async () => {
    const [address] = await privateClient.getAddresses();

    const oldTargetParticipants = await getTargetNumberOfParticipants(
      publicClient,
      contractAddress as Address,
      abi
    );
    const newTargetParticipants = Number(200);

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

    const currentTargetParticipants = await getTargetNumberOfParticipants(
      publicClient,
      contractAddress as Address,
      abi
    );

    // Check if the target number of participants was updated
    expect(currentTargetParticipants).to.equal(newTargetParticipants);
    expect(currentTargetParticipants).to.not.equal(oldTargetParticipants);
  });

  describe("Should handle reward claims correctly", () => {
    const transferAmount = parseEther("0.25");
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    it("Should have a balance equal to transferred amount", async () => {
      const transferTx = await privateClient.writeContract({
        account: mnemonicAccount,
        address: CUSD_ADDRESS,
        abi: cUSDAlfajoresContractABI,
        functionName: "transfer",
        args: [contractAddress, transferAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: transferTx });

      // Verify contract balance
      const contractBalance = await publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: cUSDAlfajoresContractABI,
        functionName: "balanceOf",
        args: [contractAddress],
      });
      expect(contractBalance).to.equal(transferAmount);
    });

    it("Should process reward claim successfully", async () => {
      // Test successful reward claim
      const claimTx = await privateClient.writeContract({
        account: mnemonicAccount,
        address: contractAddress as Address,
        abi: abi,
        functionName: "processRewardClaimByParticipant",
        args: [testAddress],
      });
      await publicClient.waitForTransactionReceipt({ hash: claimTx });

      // Verify the participant was marked as rewarded
      const hasClaimedReward = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "checkIfParticipantHasAlreadyClaimedReward",
        args: [testAddress],
      });
      expect(hasClaimedReward).to.be.true;
    });

    it("Should fail to process reward claim because of insufficient funds", async () => {
      // Test successful reward claim
      // Whitelist another address
      const anotherAddress = "0x1c30082ae6F51E31F28736be3f715261223E4EDe";
      const whitelistTx2 = await privateClient.writeContract({
        account: mnemonicAccount,
        address: contractAddress as Address,
        abi: abi,
        functionName: "whitelistOneUserAddress",
        args: [anotherAddress],
      });
      await publicClient.waitForTransactionReceipt({ hash: whitelistTx2 });

      // Test claiming with no balance (should fail)
      await expect(
        privateClient.writeContract({
          account: mnemonicAccount,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [anotherAddress],
        })
      ).to.be.rejectedWith("Contract does not have enough cUSD");
    });
  });

  // Helper functions
  async function checkIfUserAddressIsWhitelisted(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfUserAddressIsWhitelisted",
      args: [walletAddress],
    })) as boolean;
  }

  async function checkIfUserAddressIsBlacklisted(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfUserAddressIsBlacklisted",
      args: [walletAddress],
    })) as boolean;
  }

  async function getWhitelistedAddressesFromRegisteredAddresses(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    registeredAddresses: Address[]
  ): Promise<Address[]> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "getWhitelistedAddressesFromRegisteredAddresses",
      args: [registeredAddresses],
    })) as Address[];
  }

  async function getNumberOfWhitelistedUserAddresses(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(
      await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getNumberOfWhitelistedUserAddresses",
      })
    );
  }

  async function getTargetNumberOfParticipants(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(
      await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "targetNumberOfParticipants",
      })
    ) as number;
  }
});
