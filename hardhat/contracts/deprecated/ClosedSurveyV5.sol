// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// Author: @andrewkimjoseph

/**
 * @notice Contract for managing a closed survey system with participant rewards
 * @dev Inherits from Ownable for access control and Pausable for emergency stops
 */
contract ClosedSurveyV5 is Ownable, Pausable {
    using ECDSA for bytes32;

    /**
     * @notice Reference to the cUSD token contract
     */
    IERC20Metadata public immutable cUSD;

    /**
     * @notice Mapping to track participants who have received rewards
     */
    mapping(address => bool) private rewardedParticipants;

    /**
     * @notice Mapping to track participants who have been screened for the survey
     */
    mapping(address => bool) private participantsScreenedForSurvey;

    /**
     * @notice Mapping to track which signatures have been used for screening participants
     */
    mapping(bytes => bool) private signaturesUsedForScreening;

    /**
     * @notice Mapping to track which signatures have been used for claiming rewards
     */
    mapping(bytes => bool) private signaturesUsedForClaiming;

    /**
     * @notice Amount of cUSD to reward each participant
     */
    uint256 public rewardAmountPerParticipantInWei;

    /**
     * @notice Maximum number of participants allowed in the survey
     */
    uint256 public targetNumberOfParticipants;

    /**
     * @notice Counter for number of participants who have been rewarded
     */
    uint256 private numberOfRewardedParticipants;

    /**
     * @notice Counter for number of rewards that have been claimed
     */
    uint256 private numberOfClaimedRewards;

    /**
     * @notice Counter for number of participants who have been screened
     */
    uint256 public numberOfScreenedParticipants;

    /**
     * @notice Counter for number of screening signatures that have been used
     */
    uint256 public numberOfUsedScreeningSignatures;    

    /**
     * @notice Counter for number of claiming signatures that have been used
     */
    uint256 public numberOfUsedClaimingSignatures;

    /**
     * @notice Emitted when a participant completes the screening process
     * @param participant The address of the screened participant
     */
    event ParticipantScreened(address participant);

    /**
     * @notice Emitted when a participant successfully claims their reward
     * @param participant The address of the rewarded participant
     * @param rewardAmount The amount of cUSD rewarded in wei
     */
    event ParticipantRewarded(address participant, uint256 rewardAmount);

    /**
     * @notice Emitted when a signature is used to screen a participant
     * @param signature The signature that was used
     * @param participant The address of the participant who used the signature
     */
    event ScreeningSignatureUsed(bytes signature, address participant);

    /**
     * @notice Emitted when a signature is used to claim a reward
     * @param signature The signature that was used
     * @param participant The address of the participant who used the signature
     */
    event ClaimingSignatureUsed(bytes signature, address participant);

    /**
     * @notice Emitted when a participant is marked as having received their reward
     * @param participant The address of the participant marked as rewarded
     */
    event ParticipantMarkedAsRewarded(address participant);

    /**
     * @notice Emitted when reward funds are withdrawn by the researcher
     * @param researcher The address of the researcher who withdrew the funds
     * @param rewardAmount The amount of cUSD withdrawn in wei
     */
    event CUSDWithdrawn(address researcher, uint256 rewardAmount);

    /**
     * @notice Emitted when a given token is withdrawn by the researcher
     * @param researcher The address of the researcher who withdrew the funds
     * @param tokenAddress The address of the given token withdrawn in wei
     * @param rewardAmount The amount of the given token withdrawn in wei
     */
    event GivenTokenWithdrawn(address researcher, IERC20Metadata tokenAddress, uint256 rewardAmount);

    /**
     * @notice Emitted when the reward amount per participant is updated
     * @param oldcUSDRewardAmountPerParticipantInWei The previous reward amount
     * @param newcUSDRewardAmountPerParticipantInWei The new reward amount
     */
    event RewardAmountUpdated(
        uint256 oldcUSDRewardAmountPerParticipantInWei,
        uint256 newcUSDRewardAmountPerParticipantInWei
    );

    /**
     * @notice Emitted when the target number of participants is updated
     * @param oldTargetNumberOfParticipants The previous target number
     * @param newTargetNumberOfParticipants The new target number
     */
    event TargetNumberOfParticipantsUpdated(
        uint256 oldTargetNumberOfParticipants,
        uint256 newTargetNumberOfParticipants
    );

    /**
     * @dev Verifies that the signature provided matches the participant's data and was signed by the contract owner
     * @param participant The wallet address of the participant claiming the reward
     * @param surveyId Unique identifier for this reward claim
     * @param nonce Unique number to prevent relay attacks
     * @param signature Cryptographic signature generated by the contract owner
     */
    modifier onlyIfGivenScreeningSignatureIsValid(
        address participant,
        string memory surveyId,
        uint256 nonce,
        bytes memory signature
    ) {
        require(
            verifySignatureForParticipantScreening(participant, surveyId, nonce, signature),
            "Invalid signature"
        );
        _;
    }    

    /**
     * @dev Verifies that the signature provided matches the participant's data and was signed by the contract owner
     * @param participant The wallet address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent relay attacks
     * @param signature Cryptographic signature generated by the contract owner
     */
    modifier onlyIfGivenClaimingSignatureIsValid(
        address participant,
        string memory rewardId,
        uint256 nonce,
        bytes memory signature
    ) {
        require(
            verifySignatureForRewardClaiming(participant, rewardId, nonce, signature),
            "Invalid signature"
        );
        _;
    }

    /**
     * @dev Ensures a signature hasn't been used before to prevent replay attacks
     * @param signature - The cryptographic signature to check
     */
    modifier onlyIfGivenClaimingSignatureIsUnused(bytes memory signature) {
        require(
            !signaturesUsedForClaiming[signature],
            "Signature already used"
        );
        _;
    }

    /**
     * @dev Ensures participant hasn't been screened yet
     * @param participant - Address of the participant to check
     */
    modifier onlyUnscreenedParticipant(address participant) {
        require(
            !participantsScreenedForSurvey[participant],
            "Only unscreened address"
        );
        _;
    }

    /**
     * @dev Throws if called for a [participant] that is unscreened.
     */
    modifier mustBeScreened(address participant) {
        require(participantsScreenedForSurvey[participant], "Must be screened");
        _;
    }

    /**
     * @dev Throws if called for a [participant] that is rewarded.
     */
    modifier onlyUnrewardedParticipant(address participant) {
        require(
            !rewardedParticipants[participant],
            "Participant already rewarded"
        );
        _;
    }

    /**
     * @dev Throws if called for a [participant] that is not the [msg.sender].
     */
    modifier onlyIfSenderIsGivenParticipant(address participant) {
        require(msg.sender == participant, "Only valid sender");
        _;
    }

    /**
     * @dev Throws if called when [cUSD.balanceOf(address(this))] is < [rewardAmountPerParticipantInWei]
     */
    modifier onlyIfContractHasEnoughcUSD() {
        require(
            cUSD.balanceOf(address(this)) >= rewardAmountPerParticipantInWei,
            "Contract does not have enough cUSD"
        );
        _;
    }

    /**
     * @dev Throws if called when [cUSD.balanceOf(address(this))] is == 0.
     */
    modifier onlyIfContractHasAnycUSD() {
        require(
            cUSD.balanceOf(address(this)) > 0,
            "Contract does not have any cUSD"
        );
        _;
    }


    /**
     * @dev Throws if called when [token.balanceOf(address(this))] is == 0.
     */
    modifier onlyIfContractHasAnyGivenToken(IERC20Metadata token) {
        require(
            token.balanceOf(address(this)) > 0,
            "Contract does not have any of the given token"
        );
        _;
    }

    /**
     * @dev Throws if called when all participants have been rewarded.
     */
    modifier onlyWhenAllParticipantsHaveNotBeenRewarded() {
        require(
            numberOfRewardedParticipants < targetNumberOfParticipants,
            "All participants have been rewarded"
        );
        _;
    }

    /**
     * @notice Initializes the survey contract with initial parameters
     * @dev Sets up the contract with researcher address, reward amount, participant target, and cUSD token
     * @param researcher Address of the researcher who will own and manage the contract
     * @param _rewardAmountPerParticipantInWei Amount in wei to reward each participant
     * @param _targetNumberOfParticipants Maximum number of participants for the survey
     * @param cUSDToken Address of the cUSD token contract
     */
    constructor(
        address researcher,
        uint256 _rewardAmountPerParticipantInWei,
        uint256 _targetNumberOfParticipants,
        address cUSDToken
    ) Ownable(researcher) {
        require(cUSDToken != address(0), "Zero address given for cUSD Token");

        require(researcher != address(0), "Zero address given for researcher");

        require(_rewardAmountPerParticipantInWei > 0, "Invalid reward amount");

        require(
            _targetNumberOfParticipants > 0,
            "Invalid number of target participants"
        );

        cUSD = IERC20Metadata(cUSDToken);

        rewardAmountPerParticipantInWei = _rewardAmountPerParticipantInWei;
        targetNumberOfParticipants = _targetNumberOfParticipants;
    }

    /**
     * @dev Marks a [participant] as [true] in [participantsScreenedForSurvey].
     */
    function screenParticipant(address participant)
        external
        onlyIfSenderIsGivenParticipant(participant)
        onlyUnscreenedParticipant(participant)
        onlyUnrewardedParticipant(participant)
        onlyWhenAllParticipantsHaveNotBeenRewarded
    {
        require(participant != address(0), "Zero address passed");

        participantsScreenedForSurvey[participant] = true;
        unchecked {
            ++numberOfScreenedParticipants;
        }
        emit ParticipantScreened(participant);
    }


    /**
     * @dev Gets the message hash that was signed by the contract owner for participant screening
     * @param participant The wallet address of the participant being screened
     * @param surveyId A unique identifier for this specific survey 
     * @param nonce Unique number to prevent relay attacks
     * @return bytes32 The keccak256 hash of the packed parameters
     *
     * The hash is created by tightly packing the parameters in order:
     * 1. Contract address (this contract's address)
     * 2. Chain ID (current blockchain network ID)
     * 3. participant Address
     * 4. surveyId String
     * 5. nonce Unique number to prevent relay attacks
     *
     * This hash must match exactly what is signed off-chain by the contract owner
     * The inclusion of contract address and chain ID prevents replay attacks across
     * different contract deployments and blockchain networks
     */
    function getMessageHashForParticipantScreening(
        address participant,
        string memory surveyId,
        uint256 nonce
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    address(this),
                    block.chainid,
                    participant,
                    surveyId,
                    nonce
                )
            );
    }    

    /**
     * @dev Gets the message hash that was signed by the contract owner for reward claiming
     * @param participant The wallet address of the participant claiming the reward
     * @param rewardId A unique identifier for this specific reward claim
     * @param nonce Unique number to prevent relay attacks
     * @return bytes32 The keccak256 hash of the packed parameters
     *
     * The hash is created by tightly packing the parameters in order:
     * 1. Contract address (this contract's address)
     * 2. Chain ID (current blockchain network ID)
     * 3. participant Address
     * 4. rewardId String
     * 5. nonce Unique number to prevent relay attacks
     *
     * This hash must match exactly what is signed off-chain by the contract owner
     * The inclusion of contract address and chain ID prevents replay attacks across
     * different contract deployments and blockchain networks
     */
    function getMessageHashForRewardClaiming(
        address participant,
        string memory rewardId,
        uint256 nonce
    ) private view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    address(this),
                    block.chainid,
                    participant,
                    rewardId,
                    nonce
                )
            );
    }

    /**
     * @dev Verifies that a signature is valid for given participant data during screening
     * @param participant Address of the participant being screened
     * @param surveyId Unique identifier for this screening
     * @param nonce Unique number to prevent relay attacks
     * @param signature Cryptographic signature to verify
     * @return bool True if signature is valid, false otherwise
     */
    function verifySignatureForParticipantScreening(
        address participant,
        string memory surveyId,
        uint256 nonce,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 messageHash = getMessageHashForParticipantScreening(participant, surveyId, nonce);
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ethSignedMessageHash.recover(signature) == owner();
    }


    /**
     * @dev Verifies that a signature is valid for given participant data during reward claiming
     * @param participant Address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent relay attacks
     * @param signature Cryptographic signature to verify
     * @return bool True if signature is valid, false otherwise
     */
    function verifySignatureForRewardClaiming(
        address participant,
        string memory rewardId,
        uint256 nonce,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 messageHash = getMessageHashForRewardClaiming(participant, rewardId, nonce);
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ethSignedMessageHash.recover(signature) == owner();
    }

    /**
     * @notice Allows a participant to claim their reward using a valid signature
     * @dev Processes the reward claim if all conditions are met and signature is valid
     * @param participant Address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent relay attacks
     * @param signature Cryptographic signature from the contract owner
     */
    function processRewardClaimByParticipant(
        address participant,
        string memory rewardId,
        uint256 nonce,
        bytes memory signature
    )
        external
        whenNotPaused
        onlyIfGivenClaimingSignatureIsValid(participant, rewardId, nonce, signature)
        onlyIfGivenClaimingSignatureIsUnused(signature)
        onlyIfContractHasEnoughcUSD
        onlyWhenAllParticipantsHaveNotBeenRewarded
        onlyIfSenderIsGivenParticipant(participant)
        onlyUnrewardedParticipant(participant)
        mustBeScreened(participant)
    {
        bool rewardTransferIsSuccesful = rewardParticipant(participant);

        if (rewardTransferIsSuccesful) {
            markClaimingSignatureAsHavingBeenUsed(signature, participant);
            markParticipantAsHavingClaimedReward(participant);
        }
    }

    /**
     * @dev Internal function to transfer the reward to a participant
     * @param participant Address of the participant to reward
     * @return bool True if the transfer was successful
     */
    function rewardParticipant(address participant) private returns (bool) {
        bool rewardTransferIsSuccesful = cUSD.transfer(
            participant,
            rewardAmountPerParticipantInWei
        );

        if (rewardTransferIsSuccesful) {
            unchecked {
                ++numberOfRewardedParticipants;
            }
            emit ParticipantRewarded(
                participant,
                rewardAmountPerParticipantInWei
            );
        }

        return rewardTransferIsSuccesful;
    }

    /**
     * @notice Internal helper function to mark a participant as having claimed reward
     * @param participant - The address of the participant who used the signature
     */
    function markParticipantAsHavingClaimedReward(address participant) private {
        rewardedParticipants[participant] = true;

        unchecked {
            ++numberOfClaimedRewards;
        }
        emit ParticipantMarkedAsRewarded(participant);
    }

    /**
     * @notice Internal helper function to mark a signature as used for claiming
     * @param signature - The signature to mark as used
     * @param participant - The address of the participant who used the signature
     */
    function markClaimingSignatureAsHavingBeenUsed(
        bytes memory signature,
        address participant
    ) private {
        signaturesUsedForClaiming[signature] = true;

        unchecked {
            ++numberOfUsedClaimingSignatures;
        }
        emit ClaimingSignatureUsed(signature, participant);
    }

    /**
     * @notice Allows the researcher to withdraw all remaining cUSD from the contract
     * @dev Can only be called by the contract owner when the contract is not paused
     */
    function withdrawAllcUSDToResearcher()
        external
        onlyOwner
        whenNotPaused
        onlyIfContractHasAnycUSD
    {
        uint256 balance = cUSD.balanceOf(address(this));
        bool transferIsSuccessful = cUSD.transfer(owner(), balance);

        if (transferIsSuccessful) {
            emit CUSDWithdrawn(owner(), balance);
        }
    }

    /**
     * @notice Allows the researcher to withdraw all remaining [token] from the contract
     * @dev Can only be called by the contract owner when the contract is not paused
     */
    function withdrawAllGivenTokenToResearcher(IERC20Metadata token)
        external
        onlyOwner
        whenNotPaused
        onlyIfContractHasAnyGivenToken(token)
    {
        uint256 balance = token.balanceOf(address(this));
        bool transferIsSuccessful = token.transfer(owner(), balance);

        if (transferIsSuccessful) {
            emit GivenTokenWithdrawn(owner(), token, balance);
        }
    }    

    /**
     * @notice Updates the reward amount per participant
     * @dev Can only be called by the contract owner
     * @param _newRewardAmountPerParticipantInWei - New reward amount in wei
     */
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

    /**
     * @notice Updates the target number of participants for the survey
     * @dev Can only be called by the contract owner
     * @param _newTargetNumberOfParticipants - New target number of participants
     */
    function updateTargetNumberOfParticipants(
        uint256 _newTargetNumberOfParticipants
    ) external onlyOwner {
        require(
            _newTargetNumberOfParticipants != 0,
            "Zero number of target participants given"
        );

        require(
            _newTargetNumberOfParticipants >= targetNumberOfParticipants,
            "New number of target participants given is less than current number (of target participants)"
        );

        uint256 oldTargetNumberOfParticipants = targetNumberOfParticipants;

        uint256 newTargetNumberOfParticipants = _newTargetNumberOfParticipants;

        targetNumberOfParticipants = newTargetNumberOfParticipants;

        emit TargetNumberOfParticipantsUpdated(
            oldTargetNumberOfParticipants,
            newTargetNumberOfParticipants
        );
    }

    /**
     * @notice Pauses all reward claims and withdrawals
     * @dev Can only be called by the contract owner
     */
    function pauseSurvey() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes reward claims and withdrawals
     * @dev Can only be called by the contract owner
     */
    function unpauseSurvey() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Checks if a given participant has been screened
     * @param participant - Address of the participant to check
     * @return bool True if the participant has been screened
     */
    function checkIfParticipantIsScreened(address participant)
        external
        view
        returns (bool)
    {
        return participantsScreenedForSurvey[participant];
    }


    /**
     * @notice Checks if a given participant has been rewarded
     * @param participant - Address of the participant to check
     * @return bool True if the participant has been rewarded
     */
    function checkIfParticipantIsRewarded(address participant)
        external
        view
        returns (bool)
    {
        return rewardedParticipants[participant];
    }


    /**
     * @notice Checks if a given signature has been used
     * @param signature Cryptographic signature generated by the contract owner
     * @return bool True if the signature has been used
     */
    function checkIfSignatureIsUsed(bytes memory signature)
        external
        view
        returns (bool)
    {
        return signaturesUsedForClaiming[signature];
    }

    /**
     * @notice Checks if address(this) is paused
     * @return bool True if address(this) is paused
     */
    function checkIfContractIsPaused() external view returns (bool) {
        return paused();
    }

    /**
     * @notice Gets the current cUSD contract balance amount
     * @return uint256 The current cUSD contract balance amount in wei
     */
    function getCUSDContractBalanceAmount()
        external
        view
        returns (uint256)
    {
        return cUSD.balanceOf(address(this));
    }    

    /**
     * @notice Gets the current reward amount per participant
     * @return uint256 The reward amount in wei
     */
    function getRewardAmountPerParticipantInWei()
        external
        view
        returns (uint256)
    {
        return rewardAmountPerParticipantInWei;
    }

    /**
     * @notice Gets the current number of rewarded participants
     * @return uint256 The number of participants who have been rewarded
     */
    function getNumberOfRewardedParticipants() external view returns (uint256) {
        return numberOfRewardedParticipants;
    }

    /**
     * @notice Gets the target number of participants
     * @return uint256 The maximum number of participants allowed
     */
    function getTargetNumberOfParticipants() external view returns (uint256) {
        return targetNumberOfParticipants;
    }

    /**
     * @notice Gets the number of participants who have been screened
     * @return uint256 The number of screened participants
     */
    function getNumberOfScreenedParticipants() external view returns (uint256) {
        return numberOfScreenedParticipants;
    }

    /**
     * @notice Gets the number of signatures that have been used for screening
     * @return uint256 The number of used signatures
     */
    function getNumberOfUsedScreeningSignatures() external view returns (uint256) {
        return numberOfUsedScreeningSignatures;
    }

    /**
     * @notice Gets the number of signatures that have been used for claiming
     * @return uint256 The number of used signatures
     */
    function getNumberOfUsedClaimingSignatures() external view returns (uint256) {
        return numberOfUsedClaimingSignatures;
    }

    /**
     * @notice Gets the number of rewards that have been claimed
     * @return uint256 The number of claimed rewards
     */
    function getNumberOfClaimedRewards() external view returns (uint256) {
        return numberOfClaimedRewards;
    }

    /**
     * @notice Gets the address set as owner() in the constructor during deployment
     * @return address The owner
     */
    function getOwner() external view returns (address) {
        return owner();
    }
}
