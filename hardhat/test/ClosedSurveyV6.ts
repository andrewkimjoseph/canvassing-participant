import { expect } from "chai";
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  keccak256,
  toBytes,
  encodePacked,
  recoverMessageAddress,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

import { abi } from "../artifacts/contracts/ClosedSurveyV6.sol/ClosedSurveyV6.json";
import { bytecode } from "../artifacts/contracts/ClosedSurveyV6.sol/ClosedSurveyV6.json";
import { cUSDAlfajoresContractABI } from "./utils/cUSDAlfajoresContractABI";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const PK_ONE = `0x${process.env.PK}` as Address; // 0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A (Owner)
const PK_TWO = `0x${process.env.PK}` as Address; // 0x6dce6E80b113607bABf97041A0C8C5ACCC4d1a4e
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

if (!PK_ONE) throw new Error("PK_ONE not found in environment variables");
if (!PK_TWO) throw new Error("PK_TWO not found in environment variables");

if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

describe("Closed Survey V6 Test", () => {
  const publicClient = createPublicClient({
    chain: celoAlfajores,
    transport: http(INFURA_RPC_URL),
  });

  const mnemonicAccountOne = privateKeyToAccount(PK_ONE);
  const mnemonicAccountTwo = privateKeyToAccount(PK_TWO);


  const privateClient = createWalletClient({
    account: mnemonicAccountOne,
    chain: celoAlfajores,
    transport: http(INFURA_RPC_URL),
  });

  let contractAddress: Address | null | undefined;

  before(async function () {
    const hash = await privateClient.deployContract({
      abi,
      account: mnemonicAccountOne,
      args: [
        mnemonicAccountOne.address,
        parseEther("0.01"),
        BigInt(5),
        CUSD_ADDRESS,
      ],
      bytecode: bytecode as Address,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    contractAddress = receipt.contractAddress;

    console.log("Deployed contract address: ", contractAddress);

    if (!contractAddress) throw new Error("Contract deployment failed");

    // Calculate and send initial funds to the contract
    const rewardPerParticipant = parseEther("0.01");
    const numberOfParticipants = BigInt(5);
    const initialFundingAmount = rewardPerParticipant * numberOfParticipants; // 0.05 ETH in wei

    // Transfer the tokens to the contract
    const transferTx = await privateClient.writeContract({
      account: mnemonicAccountOne,
      address: CUSD_ADDRESS,
      abi: cUSDAlfajoresContractABI,
      functionName: "transfer",
      args: [contractAddress, initialFundingAmount],
    });

    await publicClient.waitForTransactionReceipt({ hash: transferTx });

    // Verify and log the contract balance
    const contractBalance = await publicClient.readContract({
      address: CUSD_ADDRESS,
      abi: cUSDAlfajoresContractABI,
      functionName: "balanceOf",
      args: [contractAddress],
    });

    console.log(
      `Contract funded with ${initialFundingAmount} wei (${
        initialFundingAmount / BigInt(10 ** 18)
      } CUSD)`
    );
    console.log(`Verified contract balance: ${contractBalance} wei`);
  });

  // TEST DESCRIPTION 1 - SIGNATURE CREATION AND VERIFICATION

  describe("1. Signature Creation", () => {
    it("1.1 Should create valid screening signatures", async () => {
      const participant = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
      const surveyId = "survey-2025-001";
      const nonce = 12345;

      // Create message hash similar to contract's implementation
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            participant,
            surveyId,
            BigInt(nonce),
          ]
        )
      );

      // Sign with owner's private key
      const signature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(messageHash) },
      });

      // Recover the signer address
      const recoveredAddress = await recoverMessageAddress({
        message: { raw: toBytes(messageHash) },
        signature,
      });

      // Verify the signer is the owner
      expect(recoveredAddress.toLowerCase()).to.equal(
        mnemonicAccountOne.address.toLowerCase()
      );
    });

    it("1.2 Should create valid claiming signatures", async () => {
      const participant = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
      const rewardId = "reward-2025-001";
      const nonce = 67890;

      // Create message hash similar to contract's implementation
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            participant,
            rewardId,
            BigInt(nonce),
          ]
        )
      );


      // Sign with owner's private key
      const signature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(messageHash) },
      });

      // Recover the signer address
      const recoveredAddress = await recoverMessageAddress({
        message: { raw: toBytes(messageHash) },
        signature,
      });

      // Verify the signer is the owner
      expect(recoveredAddress.toLowerCase()).to.equal(
        mnemonicAccountOne.address.toLowerCase()
      );
    });
  });

  // TEST DESCRIPTION 2 - SCREENING

  describe("2. Screening", () => {
    it("2.1 Should screen an unscreened address with valid signature", async () => {
      const participant = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
      const surveyId = "survey-2025-001";
      const nonce = 12345;

      // Get the initial number of screened addresses
      const initialScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      // Create message hash similar to contract's implementation
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            participant,
            surveyId,
            BigInt(nonce),
          ]
        )
      );

      // Sign with owner's private key
      const signature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(messageHash) },
      });

      // Call from the participant's address
      const screenParticipantTxn = await privateClient.writeContract({
        account: mnemonicAccountOne, // For testing we're using the same account
        address: contractAddress as Address,
        abi: abi,
        functionName: "screenParticipant",
        args: [participant, surveyId, nonce, signature],
      });

      await publicClient.waitForTransactionReceipt({
        hash: screenParticipantTxn,
      });

      const isScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        participant
      );

      const currentScreenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(isScreened).to.be.true;
      expect(currentScreenedCount).to.equal(initialScreenedCount + 1);
    });

    it("2.2 Should reject screening because participant is not sender", async () => {
      const participant = "0x89878e9744AF84c091063543688C488d393E8912";
      const surveyId = "survey-2025-invalid";
      const nonce = 54321;

      // Create an invalid signature (wrong message)
      const invalidMessageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            participant,
            "wrong-survey-id",
            BigInt(nonce),
          ]
        )
      );

      const invalidSignature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(invalidMessageHash) },
      });

      // Attempt to screen with invalid signature should fail
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [participant, surveyId, nonce, invalidSignature],
        })
      ).to.be.rejectedWith("Only valid sender");
    });
  });

  // TEST DESCRIPTION 3 - REWARDING

  describe("3. Rewarding", () => {
    const transferAmount = parseEther("1"); // Transfer more to handle multiple rewards
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";


    it("3.1 Should process reward claim successfully with valid signature", async () => {
      // Prepare for claiming
      const participant = testAddress;
      const rewardId = "reward-2025-001";
      const nonce = 13579;

      // Create claiming message hash
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            participant,
            rewardId,
            BigInt(nonce),
          ]
        )
      );

      // Sign with owner's private key
      const signature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(messageHash) },
      });

      // Process the reward claim
      const claimTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "processRewardClaimByParticipant",
        args: [participant, rewardId, nonce, signature],
      });

      await publicClient.waitForTransactionReceipt({ hash: claimTx });

      // Verify the participant was marked as rewarded
      const hasClaimedReward = await checkIfParticipantIsRewarded(
        publicClient,
        contractAddress as Address,
        abi,
        participant
      );

      expect(hasClaimedReward).to.be.true;
    });

  });

  // TEST DESCRIPTION 4 - UPDATING AND CONTRACT MANAGEMENT

  describe("4. Contract Management", () => {
    it("4.1 Should update the target number of participants (only increase allowed)", async () => {
      const oldTargetParticipants = await getTargetNumberOfParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const newTargetParticipants = Number(oldTargetParticipants) + 10; // Increase by 10

      const updateTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
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
      expect(currentTargetParticipants).to.be.greaterThan(
        oldTargetParticipants
      );
    });

    it("4.2 Should reject decreasing the target number of participants", async () => {
      const currentTargetParticipants = await getTargetNumberOfParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const decreasedTarget = Number(currentTargetParticipants) - 5; // Try to decrease by 5

      // Should reject with appropriate error
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "updateTargetNumberOfParticipants",
          args: [decreasedTarget],
        })
      ).to.be.rejectedWith(
        "New number of target participants given is less than current"
      );
    });

    it("4.3 Should pause and unpause the survey", async () => {
      // Check initial state
      const initialPauseState = await checkIfContractIsPaused(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(initialPauseState).to.be.false; // Initially not paused

      // Pause the survey
      const pauseTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "pauseSurvey",
      });

      await publicClient.waitForTransactionReceipt({
        hash: pauseTx,
      });

      // Verify paused state
      const pausedState = await checkIfContractIsPaused(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(pausedState).to.be.true; // Now paused

      // Unpause the survey
      const unpauseTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "unpauseSurvey",
      });

      await publicClient.waitForTransactionReceipt({
        hash: unpauseTx,
      });

      // Verify unpaused state
      const finalPauseState = await checkIfContractIsPaused(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(finalPauseState).to.be.false; // Now unpaused again
    });

    it("4.4 Should withdraw reward tokens successfully", async () => {
      // Get initial contract balance
      const initialContractBalance = await getContractBalance(
        publicClient,
        contractAddress as Address,
        abi
      );

      // Get initial owner balance
      const initialOwnerBalance = (await publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: cUSDAlfajoresContractABI,
        functionName: "balanceOf",
        args: [mnemonicAccountOne.address],
      })) as bigint;

      // Withdraw all tokens
      const withdrawTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "withdrawAllRewardTokenToResearcher",
      });

      await publicClient.waitForTransactionReceipt({
        hash: withdrawTx,
      });

      // Check final balances
      const finalContractBalance = await getContractBalance(
        publicClient,
        contractAddress as Address,
        abi
      );

      const finalOwnerBalance = await publicClient.readContract({
        address: CUSD_ADDRESS,
        abi: cUSDAlfajoresContractABI,
        functionName: "balanceOf",
        args: [mnemonicAccountOne.address],
      });

      // Contract should have zero balance
      expect(finalContractBalance).to.equal(BigInt(0));

      // Owner should have received the funds
      expect(finalOwnerBalance).to.equal(
        initialOwnerBalance + initialContractBalance
      );
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

  async function checkIfParticipantIsRewarded(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    walletAddress: Address
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfParticipantIsRewarded",
      args: [walletAddress],
    })) as boolean;
  }

  async function checkIfSignatureIsUsed(
    publicClient: any,
    contractAddress: Address,
    abi: any,
    signature: string
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfSignatureIsUsed",
      args: [signature],
    })) as boolean;
  }

  async function checkIfContractIsPaused(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "checkIfContractIsPaused",
    })) as boolean;
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
        functionName: "getTargetNumberOfParticipants",
      })
    ) as number;
  }

  async function getContractBalance(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<bigint> {
    return (await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "getRewardTokenContractBalanceAmount",
    })) as bigint;
  }
});
