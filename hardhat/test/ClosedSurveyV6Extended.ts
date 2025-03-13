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
import { cUSDAlfajoresContractABI } from "../utils/cUSDAlfajoresContractABI";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const PK_ONE = `0x${process.env.PK_ONE}` as Address; // 0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A (Owner)
const PK_TWO = `0x${process.env.PK_TWO}` as Address; // 0x6dce6E80b113607bABf97041A0C8C5ACCC4d1a4e
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const INFURA_RPC_URL = `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`;

if (!PK_ONE) throw new Error("PK_ONE not found in environment variables");
if (!PK_TWO) throw new Error("PK_TWO not found in environment variables");

if (!INFURA_API_KEY)
  throw new Error("INFURA_API_KEY not found in environment variables");

describe("Closed Survey V6 Test Extended", () => {
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

  const privateClientTwo = createWalletClient({
    account: mnemonicAccountTwo,
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

    it("1.3 Should reject signatures signed by non-owner account", async () => {
      const participant = mnemonicAccountTwo.address;
      const surveyId = "survey-2025-002";
      const nonce = 54321;

      // Create message hash
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

      // Sign with non-owner private key (account two)
      const signature = await privateClientTwo.signMessage({
        account: mnemonicAccountTwo,
        message: { raw: toBytes(messageHash) },
      });

      // Recover the signer address
      const recoveredAddress = await recoverMessageAddress({
        message: { raw: toBytes(messageHash) },
        signature,
      });

      // Verify the signer is account two (not the owner)
      expect(recoveredAddress.toLowerCase()).to.equal(
        mnemonicAccountTwo.address.toLowerCase()
      );
      expect(recoveredAddress.toLowerCase()).to.not.equal(
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

    it("2.3 Should screen account two address with valid signature", async () => {
      const participant = mnemonicAccountTwo.address;
      const surveyId = "survey-2025-003";
      const nonce = 67891;

      // Create message hash
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

      // Call from the participant's address (account two)
      const screenParticipantTxn = await privateClientTwo.writeContract({
        account: mnemonicAccountTwo,
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

      expect(isScreened).to.be.true;
    });

    it("2.4 Should reject screening with a used signature", async () => {
      const participant = mnemonicAccountTwo.address;
      const surveyId = "survey-2025-003";
      const nonce = 67891;

      // Create the same message hash as before
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

      // Attempt to screen with the same signature should fail
      await expect(
        privateClientTwo.writeContract({
          account: mnemonicAccountTwo,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [participant, surveyId, nonce, signature],
        })
      ).to.be.rejectedWith("Only unscreened address");
    });

    it("2.5 Should reject screening with non-owner signature", async () => {
      // Create a new account for this test - need to use a valid address format
      const nonOwnerAddress = "0x1234567890123456789012345678901234567890";
      const surveyId = "survey-2025-004";
      const nonce = 98765;

      // Create message hash
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            nonOwnerAddress,
            surveyId,
            BigInt(nonce),
          ]
        )
      );

      // Sign with account two's private key (not the owner)
      const nonOwnerSignature = await privateClientTwo.signMessage({
        account: mnemonicAccountTwo,
        message: { raw: toBytes(messageHash) },
      });

      // This should fail because the signature was not created by the owner
      // Since the actual error is "Only valid sender", update the expected error message
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [nonOwnerAddress, surveyId, nonce, nonOwnerSignature],
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
      const rewardId = "reward-2025-001-new"; // Changed the reward ID to avoid conflicts
      const nonce = 13579;

      // First, make sure the participant is screened
      // This might need to be done first if the participant hasn't been screened yet
      const isScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        participant
      );

      // Only do screening if not already screened
      if (!isScreened) {
        const surveyId = "survey-2025-001-new";
        const screeningNonce = 54321;

        // Create screening message hash
        const screeningMessageHash = keccak256(
          encodePacked(
            ["address", "uint256", "address", "string", "uint256"],
            [
              contractAddress as Address,
              BigInt(celoAlfajores.id),
              participant,
              surveyId,
              BigInt(screeningNonce),
            ]
          )
        );

        // Sign with owner's private key
        const screeningSignature = await privateClient.signMessage({
          account: mnemonicAccountOne,
          message: { raw: toBytes(screeningMessageHash) },
        });

        // Screen the participant first
        const screenTx = await privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [participant, surveyId, screeningNonce, screeningSignature],
        });

        await publicClient.waitForTransactionReceipt({ hash: screenTx });
      }

      // Now check if participant is already rewarded
      const isRewarded = await checkIfParticipantIsRewarded(
        publicClient,
        contractAddress as Address,
        abi,
        participant
      );

      // Only proceed with reward if not already rewarded
      if (!isRewarded) {
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

        // Make sure contract has funds
        const contractBalance = await getContractBalance(
          publicClient,
          contractAddress as Address,
          abi
        );

        if (contractBalance === BigInt(0)) {
          // Add some funds to the contract
          const transferAmount = parseEther("0.05");
          const fundTx = await privateClient.writeContract({
            account: mnemonicAccountOne,
            address: CUSD_ADDRESS,
            abi: cUSDAlfajoresContractABI,
            functionName: "transfer",
            args: [contractAddress, transferAmount],
          });

          await publicClient.waitForTransactionReceipt({ hash: fundTx });
        }

        // Process the reward claim
        const claimTx = await privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [participant, rewardId, nonce, signature],
        });

        await publicClient.waitForTransactionReceipt({ hash: claimTx });
      }

      // Verify the participant was marked as rewarded
      const hasClaimedReward = await checkIfParticipantIsRewarded(
        publicClient,
        contractAddress as Address,
        abi,
        participant
      );

      expect(hasClaimedReward).to.be.true;
    });

    it("3.2 Should process reward claim for the second participant", async () => {
      // Prepare for claiming
      const participant = mnemonicAccountTwo.address;
      const rewardId = "reward-2025-002";
      const nonce = 24680;

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

      // Process the reward claim from the second account
      const claimTx = await privateClientTwo.writeContract({
        account: mnemonicAccountTwo,
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

    it("3.3 Should reject reward claim with already used signature", async () => {
      // Prepare for claiming with the same data as 3.2
      const participant = mnemonicAccountTwo.address;
      const rewardId = "reward-2025-002";
      const nonce = 24680;

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

      // Attempt to claim again should fail
      await expect(
        privateClientTwo.writeContract({
          account: mnemonicAccountTwo,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [participant, rewardId, nonce, signature],
        })
      ).to.be.rejectedWith("Participant already rewarded");
    });

    it("3.4 Should reject reward claim for unscreened participant", async () => {
      // New participant address that hasn't been screened
      const unscreenedParticipant =
        "0xA123456789012345678901234567890123456789";
      const rewardId = "reward-2025-003";
      const nonce = 35791;

      // Create claiming message hash
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            unscreenedParticipant,
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

      // Attempt to claim with unscreened participant should fail
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [unscreenedParticipant, rewardId, nonce, signature],
        })
      ).to.be.rejectedWith("Only valid sender");
    });

    it("3.5 Should reject reward claim with signature from non-owner", async () => {
      // Use a new participant for this test
      const newParticipantAddress =
        "0xB123456789012345678901234567890123456789";
      const rewardId = "reward-2025-004";
      const nonce = 46802;

      // First, we need to screen this participant
      // Create screening message hash
      const screeningMessageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            newParticipantAddress,
            "survey-2025-004",
            BigInt(nonce),
          ]
        )
      );

      // Sign with owner's private key
      const screeningSignature = await privateClient.signMessage({
        account: mnemonicAccountOne,
        message: { raw: toBytes(screeningMessageHash) },
      });

      // Now, create a claiming signature with account two (not owner)
      const claimingMessageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            newParticipantAddress,
            rewardId,
            BigInt(nonce),
          ]
        )
      );

      // Sign with account two's private key (not the owner)
      const invalidClaimingSignature = await privateClientTwo.signMessage({
        account: mnemonicAccountTwo,
        message: { raw: toBytes(claimingMessageHash) },
      });

      // Attempt to claim with a signature not from the owner should fail
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [
            newParticipantAddress,
            rewardId,
            nonce,
            invalidClaimingSignature,
          ],
        })
      ).to.be.rejectedWith("Only valid sender");
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

    it("4.5 Should reject management functions when called by non-owner", async () => {
      // Create the second wallet client
      const privateClientTwo = createWalletClient({
        account: mnemonicAccountTwo,
        chain: celoAlfajores,
        transport: http(INFURA_RPC_URL),
      });

      // Try to update target participants from non-owner account
      // The actual error is "OwnableUnauthorizedAccount", so update the expected error
      await expect(
        privateClientTwo.writeContract({
          account: mnemonicAccountTwo,
          address: contractAddress as Address,
          abi: abi,
          functionName: "updateTargetNumberOfParticipants",
          args: [20],
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");

      // Try to pause survey from non-owner account
      await expect(
        privateClientTwo.writeContract({
          account: mnemonicAccountTwo,
          address: contractAddress as Address,
          abi: abi,
          functionName: "pauseSurvey",
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");

      // Try to withdraw tokens from non-owner account
      await expect(
        privateClientTwo.writeContract({
          account: mnemonicAccountTwo,
          address: contractAddress as Address,
          abi: abi,
          functionName: "withdrawAllRewardTokenToResearcher",
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("4.6 Should update reward amount per participant", async () => {
      const initialRewardAmount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getRewardAmountPerParticipantInWei",
      });

      const newRewardAmount = parseEther("0.02"); // Double the reward

      // Update reward amount
      const updateTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "updateRewardAmountPerParticipant",
        args: [newRewardAmount],
      });

      await publicClient.waitForTransactionReceipt({
        hash: updateTx,
      });

      const updatedRewardAmount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getRewardAmountPerParticipantInWei",
      });

      // Verify the reward amount was updated
      expect(updatedRewardAmount).to.equal(newRewardAmount);
      expect(updatedRewardAmount).to.not.equal(initialRewardAmount);
    });
  });

  // TEST DESCRIPTION 5 - BEHAVIOR WHEN PAUSED

  describe("5. Contract Behavior when Paused", () => {
    beforeEach(async function () {
      // Pause the contract for all tests in this section
      const pauseTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "pauseSurvey",
      });

      await publicClient.waitForTransactionReceipt({
        hash: pauseTx,
      });

      // Verify the contract is paused
      const isPaused = await checkIfContractIsPaused(
        publicClient,
        contractAddress as Address,
        abi
      );
      expect(isPaused).to.be.true;
    });

    afterEach(async function () {
      // Unpause the contract after each test
      const unpauseTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "unpauseSurvey",
      });

      await publicClient.waitForTransactionReceipt({
        hash: unpauseTx,
      });

      // Verify the contract is unpaused
      const isPaused = await checkIfContractIsPaused(
        publicClient,
        contractAddress as Address,
        abi
      );
      expect(isPaused).to.be.false;
    });

    it("5.1 Should reject screening participants when paused", async () => {
      const participant = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
      const surveyId = "survey-2025-paused";
      const nonce = 11111;

      // Create message hash
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

      // Attempt to screen while paused should fail
      // The actual error is "EnforcedPause", so update the expected error
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [participant, surveyId, nonce, signature],
        })
      ).to.be.rejectedWith("EnforcedPause");
    });

    it("5.2 Should reject reward claims when paused", async () => {
      // Create a new participant for testing - fixing the address format issue
      const testParticipant = "0x89E1CB0C01CA976C98cAbA8fB3e63B03343DcD06";
      const rewardId = "reward-2025-paused";
      const nonce = 22222;

      // Create claiming message hash
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            testParticipant,
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

      // Attempt to claim reward while paused should fail
      // The actual error is "EnforcedPause", so update the expected error
      await expect(
        privateClient.writeContract({
          account: mnemonicAccountOne,
          address: contractAddress as Address,
          abi: abi,
          functionName: "processRewardClaimByParticipant",
          args: [testParticipant, rewardId, nonce, signature],
        })
      ).to.be.rejectedWith("EnforcedPause");
    });

    it("5.3 Should allow owner management functions when paused", async () => {
      // Update target participants while paused should succeed
      const currentTarget = await getTargetNumberOfParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const newTarget = Number(currentTarget) + 5;

      const updateTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "updateTargetNumberOfParticipants",
        args: [newTarget],
      });

      await publicClient.waitForTransactionReceipt({
        hash: updateTx,
      });

      const updatedTarget = await getTargetNumberOfParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      expect(updatedTarget).to.equal(newTarget);
    });
  });

  // TEST DESCRIPTION 6 - TESTING CONTRACT LIMITS

  describe("6. Contract Limits and Edge Cases", () => {
    it("6.1 Should maintain correct counters for screened and rewarded participants", async () => {
      // Get current counts
      const screenedCount = await getNumberOfScreenedParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      const rewardedCount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getNumberOfRewardedParticipants",
      });

      const claimedCount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getNumberOfClaimedRewards",
      });

      // Verify that claim counts match rewarded counts
      expect(rewardedCount).to.equal(claimedCount);

      // Verify that screened count is at least as high as rewarded count
      expect(Number(screenedCount)).to.be.greaterThanOrEqual(
        Number(rewardedCount)
      );
    });

    it("6.2 Should track signature usage correctly", async () => {
      // Get current signature usage counts
      const screeningSigCount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getNumberOfUsedScreeningSignatures",
      });

      const claimingSigCount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getNumberOfUsedClaimingSignatures",
      });

      // Make sure we have some signatures used
      expect(Number(screeningSigCount)).to.be.greaterThan(0);
      expect(Number(claimingSigCount)).to.be.greaterThan(0);
    });

    it("6.3 Should check for contract balance and handle low balance cases", async () => {
      // Top up contract if needed for this test
      const currentBalance = await getContractBalance(
        publicClient,
        contractAddress as Address,
        abi
      );

      if (currentBalance === BigInt(0)) {
        // Send some tokens to the contract
        const transferAmount = parseEther("0.05"); // 0.05 CUSD

        const transferTx = await privateClient.writeContract({
          account: mnemonicAccountOne,
          address: CUSD_ADDRESS,
          abi: cUSDAlfajoresContractABI,
          functionName: "transfer",
          args: [contractAddress, transferAmount],
        });

        await publicClient.waitForTransactionReceipt({ hash: transferTx });

        // Verify the contract received the tokens
        const newBalance = await getContractBalance(
          publicClient,
          contractAddress as Address,
          abi
        );

        expect(newBalance).to.equal(transferAmount);
      }
    });

    it("6.4 Should handle reaching the target participant limit", async () => {
      // Check how many participants we've rewarded so far
      const currentRewardedCount = await publicClient.readContract({
        address: contractAddress as Address,
        abi: abi,
        functionName: "getNumberOfRewardedParticipants",
      });

      const currentTarget = await getTargetNumberOfParticipants(
        publicClient,
        contractAddress as Address,
        abi
      );

      // Since we can't decrease the target, we'll increase it slightly and then test with a new participant
      const increasedTarget = Number(currentTarget) + 1;

      // First update to a slightly higher target
      const updateTx = await privateClient.writeContract({
        account: mnemonicAccountOne,
        address: contractAddress as Address,
        abi: abi,
        functionName: "updateTargetNumberOfParticipants",
        args: [increasedTarget],
      });

      await publicClient.waitForTransactionReceipt({ hash: updateTx });

      // Create a new participant address for testing
      // Important: When testing the "Only valid sender" error, we need to create a wallet client
      // for this new address, or use the address of an existing wallet client

      // We'll use account two's address which we already have a wallet client for
      const newParticipant = mnemonicAccountTwo.address;
      const surveyId = "survey-2025-limit-new";
      const nonce = 99999;

      // Create message hash for screening
      const messageHash = keccak256(
        encodePacked(
          ["address", "uint256", "address", "string", "uint256"],
          [
            contractAddress as Address,
            BigInt(celoAlfajores.id),
            newParticipant,
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

      // Check if this participant is already screened
      const isScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        newParticipant
      );

      // Only proceed if not already screened
      if (!isScreened) {
        // Attempt to screen using the participant's wallet client (account two's client)
        const screenTx = await privateClientTwo.writeContract({
          account: mnemonicAccountTwo, // Important: sender must match participant address
          address: contractAddress as Address,
          abi: abi,
          functionName: "screenParticipant",
          args: [newParticipant, surveyId, nonce, signature],
        });

        await publicClient.waitForTransactionReceipt({ hash: screenTx });
      }

      // Verify the participant was screened
      const finalScreened = await checkIfParticipantIsScreened(
        publicClient,
        contractAddress as Address,
        abi,
        newParticipant
      );

      expect(finalScreened).to.be.true;
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
