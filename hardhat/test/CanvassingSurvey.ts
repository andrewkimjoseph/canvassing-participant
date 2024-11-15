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
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

import { abi } from "../artifacts/contracts/CanvassingSurvey.sol/CanvassingSurvey.json";
import { bytecode } from "../artifacts/contracts/CanvassingSurvey.sol/CanvassingSurvey.json";
import { cUSDAlfajoresContractABI } from "./utils/cUSDAlfajoresContractABI";

config();

const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
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
        parseEther("0.25"),
        BigInt(1),
        CUSD_ADDRESS,
      ],
      bytecode: bytecode as `0x${string}`,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    contractAddress = receipt.contractAddress;

    console.log("Deployed contract address: ", contractAddress);

    if (!contractAddress) throw new Error("Contract deployment failed");
  });

  it("Should whitelist an address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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

    const isWhitelisted = await checkIfAddressIsWhitelisted(
      publicClient,
      contractAddress  as Address,
      abi,
      testAddress
    );
    const currentWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
      abi
    );

    // Check if address is whitelisted and the whitelisted count has increased
    expect(isWhitelisted).to.be.true;
    expect(currentWhitelistedCount).to.equal(initialWhitelistedCount + 1);
  });

  it("Should blacklist a whitelisted address", async () => {
    const testAddress = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";

    // Get the initial number of whitelisted addresses
    const initialWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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

    const isWhitelisted = await checkIfAddressIsWhitelisted(
      publicClient,
      contractAddress  as Address,
      abi,
      testAddress
    );
    const isBlacklisted = await checkIfAddressIsBlacklisted(
      publicClient,
      contractAddress  as Address,
      abi,
      testAddress
    );
    const currentWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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
    const initialWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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
        contractAddress  as Address,
        abi,
        testAddresses
      );
    const currentWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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
    const initialWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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
        contractAddress  as Address,
        abi,
        testAddresses
      );
    const currentWhitelistedCount = await getWhitelistedAddressesCount(
      publicClient,
      contractAddress  as Address,
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
      contractAddress  as Address,
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
      contractAddress  as Address,
      abi
    );

    // Check if the target number of participants was updated
    expect(currentTargetParticipants).to.equal(newTargetParticipants);
    expect(currentTargetParticipants).to.not.equal(oldTargetParticipants);
  });

  // Helper functions
  async function checkIfAddressIsWhitelisted(
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

  async function checkIfAddressIsBlacklisted(
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

  async function getWhitelistedAddressesCount(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "getNumberOfWhitelistedUserAddresses",
    }));
  }

  async function getTargetNumberOfParticipants(
    publicClient: any,
    contractAddress: Address,
    abi: any
  ): Promise<number> {
    return Number(await publicClient.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "targetNumberOfParticipants",
    })) as number;
  }
});
