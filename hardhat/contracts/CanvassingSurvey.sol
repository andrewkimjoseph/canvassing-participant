// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Author: @andrewkimjoseph

contract CanvassingSurvey is Ownable, ReentrancyGuard, Pausable {
    IERC20Metadata public immutable cUSD;

    mapping(address => bool) private usersWhitelistedForSurvey;
    mapping(address => bool) private participantsWhoHaveClaimedRewards;

    uint256 public rewardAmountPerParticipantInWei;
    uint256 public targetNumberOfParticipants;
    uint256 public numberOfRewardedParticipants;
    uint256 public numberOfWhitelistedUserAddresses;
    uint256 public numberOfBlacklistedUserAddresses;

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

    error ZeroAddress();
    error InvalidRewardAmountGiven();
    error InvalidNumberOfTargetParticipants();
    error UserAddressNotWhitelisted(address walletAddress);
    error UserAddressAlreadyWhitelisted(address walletAddress);
    error ParticipantAlreadyRewarded(address walletAddress);
    error NoRewardFunds();
    error RewardTransferFailed();
    error AllParticipantsRewarded();

    error WithdrawalFailed();
    error InvalidArrayLength();
    error InsufficientContractBalance();

    modifier onlyWhitelistedAddress(address walletAddress) {
        if (!usersWhitelistedForSurvey[walletAddress]) {
            revert UserAddressNotWhitelisted(walletAddress);
        }
        _;
    }
    modifier mustBeWhitelisted(address walletAddress) {
        if (!usersWhitelistedForSurvey[walletAddress]) {
            revert UserAddressNotWhitelisted(walletAddress);
        }
        _;
    }

    modifier mustBeBlacklisted(address walletAddress) {
        if (usersWhitelistedForSurvey[walletAddress]) {
            revert UserAddressAlreadyWhitelisted(walletAddress);
        }
        _;
    }
    modifier onlyUnrewardedParticipant(address participantWalletAddress) {
        if (participantsWhoHaveClaimedRewards[participantWalletAddress]) {
            revert ParticipantAlreadyRewarded(participantWalletAddress);
        }
        _;
    }

    constructor(
        address researcherWalletAddress,
        uint256 _rewardAmountPerParticipantInWei,
        uint256 _targetNumberOfParticipants,
        address cUSDTokenAddress
    ) Ownable(researcherWalletAddress) {
        if (
            researcherWalletAddress == address(0) ||
            cUSDTokenAddress == address(0)
        ) {
            revert ZeroAddress();
        }
        if (_rewardAmountPerParticipantInWei == 0) {
            revert InvalidRewardAmountGiven();
        }

        if (_targetNumberOfParticipants == 0) {
            revert InvalidNumberOfTargetParticipants();
        }

        cUSD = IERC20Metadata(cUSDTokenAddress);

        rewardAmountPerParticipantInWei = _rewardAmountPerParticipantInWei;
        targetNumberOfParticipants = _targetNumberOfParticipants;
    }

    function whitelistOneAddress(address walletAddress)
        external
        onlyOwner
        mustBeBlacklisted(walletAddress)
    {
        if (walletAddress == address(0)) {
            revert ZeroAddress();
        }
        usersWhitelistedForSurvey[walletAddress] = true;
        unchecked {
            ++numberOfWhitelistedUserAddresses;
        }
        emit OneUserAddressWhitelisted(walletAddress);
    }

    function blacklistOneWhitelistedAddress(address walletAddress)
        external
        onlyOwner
        mustBeWhitelisted(walletAddress)
    {
        if (walletAddress == address(0)) {
            revert ZeroAddress();
        }
        usersWhitelistedForSurvey[walletAddress] = false;
        unchecked {
            ++numberOfBlacklistedUserAddresses;
        }
        emit OneWhitelistedUserAddressBlacklisted(walletAddress);
    }

    function whitelistMultipleUserAddresses(address[] calldata walletAddresses)
        external
        onlyOwner
    {
        uint256 length = walletAddresses.length;
        if (length == 0) {
            revert InvalidArrayLength();
        }

        for (uint256 i = 0; i < length; ) {
            if (walletAddresses[i] == address(0)) {
                revert ZeroAddress();
            }
            if (usersWhitelistedForSurvey[walletAddresses[i]]) {
                revert UserAddressAlreadyWhitelisted(walletAddresses[i]);
            }
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
        if (length == 0) {
            revert InvalidArrayLength();
        }

        for (uint256 i = 0; i < length; ) {
            if (walletAddresses[i] == address(0)) {
                revert ZeroAddress();
            }
            if (!usersWhitelistedForSurvey[walletAddresses[i]]) {
                revert UserAddressNotWhitelisted(walletAddresses[i]);
            }
            unchecked {
                ++i;
            }
        }

        for (uint256 i = 0; i < length; ) {
            usersWhitelistedForSurvey[walletAddresses[i]] = false;
            unchecked {
                ++numberOfBlacklistedUserAddresses;
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
        onlyWhitelistedAddress(walletAddress)
        onlyUnrewardedParticipant(walletAddress)
    {
        if (cUSD.balanceOf(address(this)) < rewardAmountPerParticipantInWei) {
            revert InsufficientContractBalance();
        }

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
        if (numberOfRewardedParticipants == targetNumberOfParticipants) {
            revert AllParticipantsRewarded();
        }
        bool success = cUSD.transfer(
            participantWalletAddress,
            rewardAmountPerParticipantInWei
        );
        if (!success) {
            revert RewardTransferFailed();
        }
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
        nonReentrant
    {
        uint256 balance = cUSD.balanceOf(address(this));
        if (balance == 0) {
            revert NoRewardFunds();
        }
        bool success = cUSD.transfer(owner(), balance);
        if (!success) {
            revert WithdrawalFailed();
        }
        emit RewardFundsWithdrawn(owner(), balance);
    }

    function updateRewardAmountPerParticipant(
        uint256 _newRewardAmountPerParticipantInWei
    ) external onlyOwner {
        if (_newRewardAmountPerParticipantInWei == 0) {
            revert InvalidRewardAmountGiven();
        }
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
        if (_newTargetNumberOfParticipants == 0) {
            revert InvalidNumberOfTargetParticipants();
        }

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
        if (length == 0) {
            revert InvalidArrayLength();
        }

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

    function getNumberOfWhitelistedUserAddresses() external view returns (uint256) {
        return numberOfWhitelistedUserAddresses;
    }

    function getNumberOfBlacklistedUserAddresses() external view returns (uint256) {
        return numberOfBlacklistedUserAddresses;
    }
}

// researcherWalletAddress:             0xE49B05F2c7DD51f61E415E1DFAc10B80074B001A
// _rewardAmountPerParticipantInWei:    250000000000000000
// _targetNumberOfParticipants:         1
// cUSDTokenAddress:                    0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
