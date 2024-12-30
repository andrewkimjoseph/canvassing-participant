// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Author: @andrewkimjoseph

contract ClosedSurveyV3 is Ownable, ReentrancyGuard, Pausable {
    IERC20Metadata public immutable cUSD;

    mapping(address => bool) private participantsWhitelistedForSurvey;
    mapping(address => bool) private rewardedParticipants;
    mapping(address => bool) private participantsScreenedForSurvey;

    uint256 public rewardAmountPerParticipantInWei;
    uint256 public targetNumberOfParticipants;
    uint256 private numberOfRewardedParticipants;
    uint256 public numberOfWhitelistedParticipants;
    uint256 public numberOfScreenedParticipants;

    event OneParticipantWhitelisted(address participantWalletAddress);
    event MultipleParticipantsWhitelisted(
        address[] participantWalletAddresses
    );

    event ParticipantScreened(address participantWalletAddress);

    event OneWhitelistedParticipantBlacklisted(
        address participantWalletAddress
    );
    event MultipleWhitelistedParticipantsBlacklisted(
        address[] walletAddresses
    );

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

    modifier onlyWhitelistedParticipant(address participantWalletAddress) {
        require(
            participantsWhitelistedForSurvey[participantWalletAddress],
            "Only whitelisted address"
        );
        _;
    }

    modifier mustBeBlacklisted(address participantWalletAddress) {
        require(
            !participantsWhitelistedForSurvey[participantWalletAddress],
            "Must be blacklisted"
        );
        _;
    }

    modifier onlyUnscreenedAddress(address participantWalletAddress) {
        require(
            participantsScreenedForSurvey[participantWalletAddress],
            "Only unscreened address"
        );
        _;
    }
    modifier mustBeScreened(address participantWalletAddress) {
        require(
            participantsScreenedForSurvey[participantWalletAddress],
            "Must be screened"
        );
        _;
    }
    modifier mustBeUnscreened(address participantWalletAddress) {
        require(
            !participantsScreenedForSurvey[participantWalletAddress],
            "Must be unscreened"
        );
        _;
    }

    modifier onlyUnrewardedParticipant(address participantWalletAddress) {
        require(
            !rewardedParticipants[participantWalletAddress],
            "Participant already rewarded"
        );
        _;
    }

    modifier onlyIfSenderIsGivenParticipant(address participantWalletAddress) {
        require(msg.sender == participantWalletAddress, "Only valid sender");
        _;
    }

    modifier onlyIfContractHasEnoughcUSD() {
        require(
            cUSD.balanceOf(address(this)) >= rewardAmountPerParticipantInWei,
            "Contract does not have enough cUSD"
        );
        _;
    }

    modifier onlyIfContractHasAnycUSD() {
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

    function screenParticipant(address participantWalletAddress)
        external
        onlyIfSenderIsGivenParticipant(participantWalletAddress)
        mustBeBlacklisted(participantWalletAddress)
    {
        require(participantWalletAddress != address(0), "Zero address passed");

        participantsScreenedForSurvey[participantWalletAddress] = true;
        unchecked {
            ++numberOfScreenedParticipants;
        }
        emit ParticipantScreened(participantWalletAddress);
    }

    function whitelistOneParticipant(address participantWalletAddress)
        external
        onlyOwner
        mustBeBlacklisted(participantWalletAddress)
    {
        require(participantWalletAddress != address(0), "Zero address passed");

        participantsWhitelistedForSurvey[participantWalletAddress] = true;
        unchecked {
            ++numberOfWhitelistedParticipants;
        }
        emit OneParticipantWhitelisted(participantWalletAddress);
    }

    function blacklistOneParticipant(address participantWalletAddress)
        external
        onlyOwner
        onlyWhitelistedParticipant(participantWalletAddress)
    {
        require(participantWalletAddress != address(0), "Zero address passed");

        participantsWhitelistedForSurvey[participantWalletAddress] = false;
        unchecked {
            --numberOfWhitelistedParticipants;
        }
        emit OneWhitelistedParticipantBlacklisted(participantWalletAddress);
    }

    function whitelistMultipleParticipants(address[] calldata participantWalletAddresses)
        external
        onlyOwner
    {
        uint256 numberOfAddressesGiven = participantWalletAddresses.length;

        require(numberOfAddressesGiven > 0, "No addresses passed");

        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            require(
                participantWalletAddresses[i] != address(0),
                "One/more zero addresses given"
            );

            require(
                !participantsWhitelistedForSurvey[participantWalletAddresses[i]],
                "One/more given addresses already whitelisted"
            );

            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            participantsWhitelistedForSurvey[participantWalletAddresses[i]] = true;
            unchecked {
                ++numberOfWhitelistedParticipants;
            }
            unchecked {
                ++i;
            }
        }

        emit MultipleParticipantsWhitelisted(participantWalletAddresses);
    }

    function blacklistMultipleParticipants(
        address[] calldata participantWalletAddresses
    ) external onlyOwner {
        uint256 numberOfAddressesGiven = participantWalletAddresses.length;

        require(numberOfAddressesGiven > 0, "No addresses passed");

        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            require(
                participantWalletAddresses[i] != address(0),
                "One/more zero addresses given"
            );

            require(
                participantsWhitelistedForSurvey[participantWalletAddresses[i]],
                "One/more given addresses already blacklisted"
            );

            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            participantsWhitelistedForSurvey[participantWalletAddresses[i]] = false;
            unchecked {
                --numberOfWhitelistedParticipants;
            }
            unchecked {
                ++i;
            }
        }
        emit MultipleWhitelistedParticipantsBlacklisted(participantWalletAddresses);
    }

    function processRewardClaimByParticipant(address walletAddress)
        external
        whenNotPaused
        nonReentrant
        onlyIfContractHasEnoughcUSD
        onlyWhenAllParticipantHaveNotBeenRewarded
        onlyIfSenderIsGivenParticipant(walletAddress)
        onlyWhitelistedParticipant(walletAddress)
        onlyUnrewardedParticipant(walletAddress)
    {
        bool rewardTransferIsSuccesful = rewardParticipant(walletAddress);

        if (rewardTransferIsSuccesful) {
            markParticipantAsHavingClaimedReward(walletAddress);
        }
    }

    function markParticipantAsHavingClaimedReward(
        address participantWalletAddress
    ) private {
        rewardedParticipants[participantWalletAddress] = true;
        emit ParticipantMarkedAsRewarded(participantWalletAddress);
    }

    function rewardParticipant(address participantWalletAddress)
        private
        returns (bool)
    {
        bool rewardTransferIsSuccesful = cUSD.transfer(
            participantWalletAddress,
            rewardAmountPerParticipantInWei
        );

        if (rewardTransferIsSuccesful) {
            unchecked {
                ++numberOfRewardedParticipants;
            }
            emit ParticipantRewarded(
                participantWalletAddress,
                rewardAmountPerParticipantInWei
            );
        }

        return rewardTransferIsSuccesful;
    }

    function withdrawAllRewardFundsToResearcher()
        external
        onlyOwner
        whenNotPaused
        onlyIfContractHasAnycUSD
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

    function getWhitelistedParticipantsFromRegisteredParticipants(
        address[] calldata registeredAddresses
    ) external view returns (address[] memory) {
        uint256 numberOfAddressesGiven = registeredAddresses.length;

        require(numberOfAddressesGiven != 0, "No addresses passed");
        uint256 whitelistedCount = 0;
        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            if (participantsWhitelistedForSurvey[registeredAddresses[i]]) {
                whitelistedCount++;
            }
            unchecked {
                ++i;
            }
        }

        address[] memory whitelistedAddresses = new address[](whitelistedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < numberOfAddressesGiven; ) {
            if (participantsWhitelistedForSurvey[registeredAddresses[i]]) {
                whitelistedAddresses[index++] = registeredAddresses[i];
            }
            unchecked {
                ++i;
            }
        }
        return whitelistedAddresses;
    }

    function checkIfParticipantHasAlreadyClaimedReward(address participantWalletAddress)
        external
        view
        returns (bool)
    {
        return rewardedParticipants[participantWalletAddress];
    }

    function checkIfParticipantIsWhitelisted(address participantWalletAddress)
        external
        view
        returns (bool)
    {
        return participantsWhitelistedForSurvey[participantWalletAddress];
    }

    function checkIfParticipantIsBlacklisted(address participantWalletAddress)
        external
        view
        returns (bool)
    {
        return !participantsWhitelistedForSurvey[participantWalletAddress];
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

    function getNumberOfWhitelistedParticipants()
        external
        view
        returns (uint256)
    {
        return numberOfWhitelistedParticipants;
    }
}

// researcherWalletAddress:             0x89878e9744AF84c091063543688C488d393E8912
// _rewardAmountPerParticipantInWei:    2000000000000000000
// _targetNumberOfParticipants:         9
// cUSDTokenAddress:                    0x765DE816845861e75A25fCA122bb6898B8B1282a
// ["0x70eEEda66D4f23a9E7bFF93b7d152286eA63f52C","0x2FC0047E148888836DB5257D79A7ca8327dd9Bcc","0xA3872860EE9FeAB369c1a5E911CeCc2F4c40f702"]
