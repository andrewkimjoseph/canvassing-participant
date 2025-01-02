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

import { abi } from "../artifacts/contracts/ClosedSurveyV3.sol/ClosedSurveyV3.json";
import { bytecode } from "../artifacts/contracts/ClosedSurveyV3.sol/ClosedSurveyV3.json";
import { cUSDAlfajoresContractABI } from "./utils/cUSDAlfajoresContractABI";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const SRP = process.env.SRP;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

if (!SRP) throw new Error("SRP not found in environment variables");
if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

describe("Closed Survey V3 Test", () => {
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

  // TEST DESCRIPTION 1 - SCREENING

  describe("Screening", () => {
    it("Should screen an unscreened address since address is sender", async () => {
      const sender = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

      // Get the initial number of screened addresses
      const initialScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const screenParticipantTxn = await privateClient.writeContract({
        account: mnemonicAccount,
        address: contractAddress as Address,
        abi: abi,
        functionName: "screenParticipant",
        args: [sender],
      });

      await publicClient.waitForTransactionReceipt({
        hash: screenParticipantTxn,
      });

      const isScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        sender
      );
      const currentScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(isScreened).to.be.true;
      expect(currentScreenedCount).to.equal(initialScreenedCount + 1);
    });

    it("Should not screen an unscreened address since address is not sender", async () => {
      const notSender = "0x89878e9744AF84c091063543688C488d393E8912";

      const initialScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      await expect(
        privateClient.writeContract({
          account: mnemonicAccount,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [notSender],
        })
      ).to.be.rejectedWith("Only valid sender");

      const isScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        notSender
      );

      const currentScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(isScreened).to.be.false;
      expect(currentScreenedCount).to.equal(initialScreenedCount);
    });
  });

  // TEST DESCRIPTION 2 - WHITELISTING AND BLACKLISTING
  describe("Whilesting and Blacklisting", () => {
    it("Should whitelist an address", async () => {
      const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

      const initialWhitelistedCount = await getNumberOfWhitelistedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const whitelistParticipantTxn = await privateClient.writeContract({
        account: mnemonicAccount,
        address: contractAddress as Address,
        abi: abi,
        functionName: "whitelistParticipant",
        args: [testAddress],
      });

      await publicClient.waitForTransactionReceipt({
        hash: whitelistParticipantTxn,
      });

      const isWhitelisted = await checkIfParticipantIsWhitelisted(
        publicClient,
        contractAddress as Address,
        abi,
        testAddress
      );
      const currentWhitelistedCount = await getNumberOfWhitelistedParticipants(
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
      const initialWhitelistedCount = await getNumberOfWhitelistedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const blacklistWhitelistedParticipantTxn =
        await privateClient.writeContract({
          account: mnemonicAccount,
          address: contractAddress as Address,
          abi: abi,
          functionName: "blacklistWhitelistedParticipant",
          args: [testAddress],
        });

      await publicClient.waitForTransactionReceipt({
        hash: blacklistWhitelistedParticipantTxn,
      });

      const isWhitelisted = await checkIfParticipantIsWhitelisted(
        publicClient,
        contractAddress as Address,
        abi,
        testAddress
      );
      const isBlacklisted = await checkIfParticipantIsBlacklisted(
        publicClient,
        contractAddress as Address,
        abi,
        testAddress
      );
      const currentWhitelistedCount = await getNumberOfWhitelistedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      // Check if address is blacklisted and the whitelisted count has decreased
      expect(isWhitelisted).to.be.false;
      expect(isBlacklisted).to.be.true;
      expect(currentWhitelistedCount).to.equal(initialWhitelistedCount - 1);
    });
  });

  // TEST DESCRIPTION 3 - REWARDING

  describe("Rewarding", () => {
    const transferAmount = parseEther("0.25");
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    it("Should have a balance equal to amount being transferred amount", async () => {
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

      const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
      const whitelistTx2 = await privateClient.writeContract({
        account: mnemonicAccount,
        address: contractAddress as Address,
        abi: abi,
        functionName: "whitelistParticipant",
        args: [testAddress],
      });
      await publicClient.waitForTransactionReceipt({ hash: whitelistTx2 });

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

      // Test claiming with no balance (should fail)
      await expect(
        privateClient.writeContract({
          account: mnemonicAccount,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [testAddress],
        })
      ).to.be.rejectedWith("Contract does not have enough cUSD");
    });
  });

  describe("Updating", () => {
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
  });

  // Helper functions
  async function checkIfParticipantIsScreened(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfParticipantIsScreened",
      args: [walletAddress],
    })) as boolean;
  }

  async function checkIfParticipantIsWhitelisted(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfParticipantIsWhitelisted",
      args: [walletAddress],
    })) as boolean;
  }

  async function checkIfParticipantIsBlacklisted(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfParticipantIsBlacklisted",
      args: [walletAddress],
    })) as boolean;
  }

  async function getNumberOfWhitelistedParticipants(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(
      await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getNumberOfWhitelistedParticipants",
      })
    );
  }

  async function getNumberOfScreenedParticipants(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(
      await publicClient.readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getNumberOfScreenedParticipants",
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
