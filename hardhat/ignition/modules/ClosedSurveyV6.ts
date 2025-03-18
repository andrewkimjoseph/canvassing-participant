import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import constructorArgs from "../../constructorArgs";

const RESEARCHER_WALLET_ADDRESS = constructorArgs[0];
const _REWARD_AMOUNT_PER_PARTICIPANT_IN_WEI = constructorArgs[1];
const _TARGET_NUMBER_OF_PARTICIPANTS = constructorArgs[2];
const _REWARDTOKEN = constructorArgs[3];


const ClosedSurveyV6Module = buildModule("ClosedSurveyV6Module", (imb) => {
  const researcher = imb.getParameter(
    "researcher",
    RESEARCHER_WALLET_ADDRESS
  );

  const _rewardAmountPerParticipantInWei = imb.getParameter(
    "_rewardAmountPerParticipantInWei",
    String(_REWARD_AMOUNT_PER_PARTICIPANT_IN_WEI)
  );

  const _targetNumberOfParticipants = imb.getParameter(
    "_targetNumberOfParticipants",
    String(_TARGET_NUMBER_OF_PARTICIPANTS)
  );

  const _rewardToken = imb.getParameter(
    "_rewardToken",
    _REWARDTOKEN
  );

  const closedSurveyV6 = imb.contract("contracts/ClosedSurveyV6.sol:ClosedSurveyV6", [
    researcher,
    _rewardAmountPerParticipantInWei,
    _targetNumberOfParticipants,
    _rewardToken
  ]);

  return { closedSurveyV6 };
});

export default ClosedSurveyV6Module;