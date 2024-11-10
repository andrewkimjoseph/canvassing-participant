import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const RESEARCHER_WALLET_ADDRESS = "0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A";
const _REWARD_AMOUNT_PER_PARTICIPANT_IN_WEI = parseEther("0.25");
const _TARGET_NUMBER_OF_PARTICIPANTS = BigInt(1);
const CUSD_TOKEN_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";


const CanvassingSurveyModule = buildModule("CanvassingSurveyModule", (imb) => {
  const researcherWalletAddress = imb.getParameter(
    "researcherWalletAddress",
    RESEARCHER_WALLET_ADDRESS
  );

  const _rewardAmountPerParticipantInWei = imb.getParameter(
    "_rewardAmountPerParticipantInWei",
    _REWARD_AMOUNT_PER_PARTICIPANT_IN_WEI
  );

  const _targetNumberOfParticipants = imb.getParameter(
    "_targetNumberOfParticipants",
    _TARGET_NUMBER_OF_PARTICIPANTS
  );

  const cUSDTokenAddress = imb.getParameter(
    "cUSDTokenAddress",
    CUSD_TOKEN_ADDRESS
  );

  const canvassingSurvey = imb.contract("CanvassingSurveyModule", [
    researcherWalletAddress,
    _rewardAmountPerParticipantInWei,
    _targetNumberOfParticipants,
    cUSDTokenAddress,
  ]);

  return { canvassingSurvey };
});

export default CanvassingSurveyModule;
