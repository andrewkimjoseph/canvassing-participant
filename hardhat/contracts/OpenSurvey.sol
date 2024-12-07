// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Author: @andrewkimjoseph

contract OpenSurvey is Ownable, ReentrancyGuard, Pausable {
    IERC20Metadata public immutable cUSD;

    mapping(address => bool) private participantsWhoHaveClaimedRewards;

    uint256 public rewardAmountPerParticipantInWei;
    uint256 public targetNumberOfParticipants;
    uint256 public numberOfRewardedParticipants;

    event ParticipantRewarded(
        address participantWalletAddress,
        uint256 rewardAmount
    );
    event ParticipantMarkedAsRewarded(address participantWalletAddress);
    event RewardFundsWithdrawn(
        address researcherWalletAddress,
        uint256 rewardAmount
    );
    event RewardAmountUpdated(
        uint256 oldcUSDRewardAmountPerParticipantInWei,
        uint256 newcUSDRewardAmountPerParticipantInWei
    );
    event TargetNumberOfParticipantsUpdates(
        uint256 oldTargetNumberOfParticipants,
        uint256 newTargetNumberOfParticipants
    );

    modifier onlyUnrewardedParticipant(address participantWalletAddress) {
        require(
            !participantsWhoHaveClaimedRewards[participantWalletAddress],
            "Participant already rewarded"
        );
        _;
    }

    modifier onlyValidSender(address messageSender) {
        require(msg.sender == messageSender, "Only valid sender");
        _;
    }

    modifier onlyWhenTheContractHasEnoughcUSD() {
        require(
            cUSD.balanceOf(address(this)) >= rewardAmountPerParticipantInWei,
            "Contract does not have enough cUSD"
        );
        _;
    }

    modifier onlyIfTheContractHasAnycUSD() {
        require(
            cUSD.balanceOf(address(this)) > 0,
            "Contract does not have any cUSD"
        );
        _;
    }

    modifier onlyWhenAllParticipantHaveNotBeenRewarded() {
        require(
            numberOfRewardedParticipants < targetNumberOfParticipants,
            "All participants have been rewarded"
        );
        _;
    }

    constructor(
        address researcherWalletAddress,
        uint256 _rewardAmountPerParticipantInWei,
        uint256 _targetNumberOfParticipants,
        address cUSDTokenAddress
    ) Ownable(researcherWalletAddress) {
        require(
            cUSDTokenAddress != address(0),
            "Zero address given for cUSDTokenAddress"
        );

        require(
            researcherWalletAddress != address(0),
            "Zero address given for researcherWalletAddress"
        );

        require(_rewardAmountPerParticipantInWei > 0, "Invalid reward amount");

        require(
            _targetNumberOfParticipants > 0,
            "Invalid number of target participants"
        );

        cUSD = IERC20Metadata(cUSDTokenAddress);

        rewardAmountPerParticipantInWei = _rewardAmountPerParticipantInWei;
        targetNumberOfParticipants = _targetNumberOfParticipants;
    }

    function processRewardClaimByParticipant(address walletAddress)
        external
        whenNotPaused
        nonReentrant
        onlyWhenTheContractHasEnoughcUSD
        onlyWhenAllParticipantHaveNotBeenRewarded
        onlyValidSender(walletAddress)
        onlyUnrewardedParticipant(walletAddress)
    {
        markParticipantAsHavingClaimedReward(walletAddress);
        rewardParticipant(walletAddress);
    }

    function markParticipantAsHavingClaimedReward(
        address participantWalletAddress
    ) private {
        participantsWhoHaveClaimedRewards[participantWalletAddress] = true;
        emit ParticipantMarkedAsRewarded(participantWalletAddress);
    }

    function rewardParticipant(address participantWalletAddress) private {
        cUSD.transfer(
            participantWalletAddress,
            rewardAmountPerParticipantInWei
        );
        unchecked {
            ++numberOfRewardedParticipants;
        }
        emit ParticipantRewarded(
            participantWalletAddress,
            rewardAmountPerParticipantInWei
        );
    }

    function withdrawAllRewardFundsToResearcher()
        external
        onlyOwner
        whenNotPaused
        onlyIfTheContractHasAnycUSD
    {
        uint256 balance = cUSD.balanceOf(address(this));
        cUSD.transfer(owner(), balance);
        emit RewardFundsWithdrawn(owner(), balance);
    }

    function updateRewardAmountPerParticipant(
        uint256 _newRewardAmountPerParticipantInWei
    ) external onlyOwner {
        require(
            _newRewardAmountPerParticipantInWei != 0,
            "Zero reward amount given"
        );

        uint256 oldRewardAmountPerParticipantInWei = rewardAmountPerParticipantInWei;

        uint256 newRewardAmountPerParticipantInWei = _newRewardAmountPerParticipantInWei;
        rewardAmountPerParticipantInWei = newRewardAmountPerParticipantInWei;

        emit RewardAmountUpdated(
            oldRewardAmountPerParticipantInWei,
            newRewardAmountPerParticipantInWei
        );
    }

    function updateTargetNumberOfParticipants(
        uint256 _newTargetNumberOfParticipants
    ) external onlyOwner {
        require(
            _newTargetNumberOfParticipants != 0,
            "Zero number of target participants given"
        );

        uint256 oldTargetNumberOfParticipants = targetNumberOfParticipants;

        uint256 newTargetNumberOfParticipants = _newTargetNumberOfParticipants;

        targetNumberOfParticipants = newTargetNumberOfParticipants;

        emit TargetNumberOfParticipantsUpdates(
            oldTargetNumberOfParticipants,
            newTargetNumberOfParticipants
        );
    }

    function pauseSurvey() external onlyOwner {
        _pause();
    }

    function unpauseSurvey() external onlyOwner {
        _unpause();
    }

    function checkIfParticipantHasAlreadyClaimedReward(address walletAddress)
        external
        view
        returns (bool)
    {
        return participantsWhoHaveClaimedRewards[walletAddress];
    }

    function getRewardAmountPerParticipantInWei()
        external
        view
        returns (uint256)
    {
        return rewardAmountPerParticipantInWei;
    }

    function getNumberOfRewardedParticipants() external view returns (uint256) {
        return numberOfRewardedParticipants;
    }

    function getTargetNumberOfParticipants() external view returns (uint256) {
        return targetNumberOfParticipants;
    }
}

// researcherWalletAddress:             0x89878e9744AF84c091063543688C488d393E8912
// _rewardAmountPerParticipantInWei:    2000000000000000000
// _targetNumberOfParticipants:         9
// cUSDTokenAddress:                    0x765DE816845861e75A25fCA122bb6898B8B1282a
// ["0x70eEEda66D4f23a9E7bFF93b7d152286eA63f52C","0x2FC0047E148888836DB5257D79A7ca8327dd9Bcc","0xA3872860EE9FeAB369c1a5E911CeCc2F4c40f702"]
