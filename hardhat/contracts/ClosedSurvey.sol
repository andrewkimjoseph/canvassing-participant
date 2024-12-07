// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Author: @andrewkimjoseph

contract ClosedSurvey is Ownable, ReentrancyGuard, Pausable {
    IERC20Metadata public immutable cUSD;

    mapping(address => bool) private usersWhitelistedForSurvey;
    mapping(address => bool) private participantsWhoHaveClaimedRewards;

    uint256 public rewardAmountPerParticipantInWei;
    uint256 public targetNumberOfParticipants;
    uint256 public numberOfRewardedParticipants;
    uint256 public numberOfWhitelistedUserAddresses;

    event OneUserAddressWhitelisted(address participantWalletAddress);
    event MultipleUserAddressesWhitelisted(address[] walletAddresses);
    event OneWhitelistedUserAddressBlacklisted(
        address participantWalletAddress
    );
    event MultipleWhitelistedUserAddressesBlacklisted(
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

    modifier onlyWhitelistedAddress(address walletAddress) {
        require(
            usersWhitelistedForSurvey[walletAddress],
            "Only whitelisted address"
        );
        _;
    }
    modifier mustBeWhitelisted(address walletAddress) {
        require(
            !usersWhitelistedForSurvey[walletAddress],
            "Must be whitelisted"
        );
        _;
    }

    modifier mustBeBlacklisted(address walletAddress) {
        require(
            !usersWhitelistedForSurvey[walletAddress],
            "Must be blacklisted"
        );
        _;
    }
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

    modifier onlyWhenTheContractHadEnoughcUSD() {
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

    function whitelistOneUserAddress(address walletAddress)
        external
        onlyOwner
        mustBeBlacklisted(walletAddress)
    {
        require(walletAddress != address(0), "Zero address passed");

        usersWhitelistedForSurvey[walletAddress] = true;
        unchecked {
            ++numberOfWhitelistedUserAddresses;
        }
        emit OneUserAddressWhitelisted(walletAddress);
    }

    function blacklistOneWhitelistedUserAddress(address walletAddress)
        external
        onlyOwner
        mustBeWhitelisted(walletAddress)
    {
        require(walletAddress != address(0), "Zero address passed");

        usersWhitelistedForSurvey[walletAddress] = false;
        unchecked {
            --numberOfWhitelistedUserAddresses;
        }
        emit OneWhitelistedUserAddressBlacklisted(walletAddress);
    }

    function whitelistMultipleUserAddresses(address[] calldata walletAddresses)
        external
        onlyOwner
    {
        uint256 length = walletAddresses.length;

        require(length > 0, "No addresses passed");

        for (uint256 i = 0; i < length; ) {
            require(
                walletAddresses[i] != address(0),
                "One/more zero addresses given"
            );

            require(
                !usersWhitelistedForSurvey[walletAddresses[i]],
                "One/more given addresses already whitelisted"
            );

            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < length; ) {
            usersWhitelistedForSurvey[walletAddresses[i]] = true;
            unchecked {
                ++numberOfWhitelistedUserAddresses;
            }
            unchecked {
                ++i;
            }
        }

        emit MultipleUserAddressesWhitelisted(walletAddresses);
    }

    function blacklistMultipleWhitelistedUserAddresses(
        address[] calldata walletAddresses
    ) external onlyOwner {
        uint256 length = walletAddresses.length;

        require(length > 0, "No addresses passed");

        for (uint256 i = 0; i < length; ) {
            require(
                walletAddresses[i] != address(0),
                "One/more zero addresses given"
            );

            require(
                usersWhitelistedForSurvey[walletAddresses[i]],
                "One/more given addresses already blacklisted"
            );

            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < length; ) {
            usersWhitelistedForSurvey[walletAddresses[i]] = false;
            unchecked {
                --numberOfWhitelistedUserAddresses;
            }
            unchecked {
                ++i;
            }
        }
        emit MultipleWhitelistedUserAddressesBlacklisted(walletAddresses);
    }

    function processRewardClaimByParticipant(address walletAddress)
        external
        whenNotPaused
        nonReentrant
        onlyWhenTheContractHadEnoughcUSD
        onlyWhenAllParticipantHaveNotBeenRewarded
        onlyValidSender(walletAddress)
        onlyWhitelistedAddress(walletAddress)
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

    function getWhitelistedAddressesFromRegisteredAddresses(
        address[] calldata registeredAddresses
    ) external view returns (address[] memory) {
        uint256 length = registeredAddresses.length;

        require(length != 0, "No addresses passed");
        uint256 whitelistedCount = 0;
        for (uint256 i = 0; i < length; ) {
            if (usersWhitelistedForSurvey[registeredAddresses[i]]) {
                whitelistedCount++;
            }
            unchecked {
                ++i;
            }
        }

        address[] memory whitelistedAddresses = new address[](whitelistedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < length; ) {
            if (usersWhitelistedForSurvey[registeredAddresses[i]]) {
                whitelistedAddresses[index++] = registeredAddresses[i];
            }
            unchecked {
                ++i;
            }
        }
        return whitelistedAddresses;
    }

    function checkIfParticipantHasAlreadyClaimedReward(address walletAddress)
        external
        view
        returns (bool)
    {
        return participantsWhoHaveClaimedRewards[walletAddress];
    }

    function checkIfUserAddressIsWhitelisted(address walletAddress)
        external
        view
        returns (bool)
    {
        return usersWhitelistedForSurvey[walletAddress];
    }

    function checkIfUserAddressIsBlacklisted(address walletAddress)
        external
        view
        returns (bool)
    {
        return !usersWhitelistedForSurvey[walletAddress];
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

    function getNumberOfWhitelistedUserAddresses()
        external
        view
        returns (uint256)
    {
        return numberOfWhitelistedUserAddresses;
    }
}

// researcherWalletAddress:             0x89878e9744AF84c091063543688C488d393E8912
// _rewardAmountPerParticipantInWei:    2000000000000000000
// _targetNumberOfParticipants:         9
// cUSDTokenAddress:                    0x765DE816845861e75A25fCA122bb6898B8B1282a
// ["0x70eEEda66D4f23a9E7bFF93b7d152286eA63f52C","0x2FC0047E148888836DB5257D79A7ca8327dd9Bcc","0xA3872860EE9FeAB369c1a5E911CeCc2F4c40f702"]
