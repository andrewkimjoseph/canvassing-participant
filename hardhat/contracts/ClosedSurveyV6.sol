// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// Author: @andrewkimjoseph

/**
 * @notice Smart contract for managing a closed survey system with ERC20 token rewards
 * @dev Inherits from Ownable for researcher access control and Pausable for emergency stops
 *      This contract handles the complete lifecycle of a survey: participant screening,
 *      signature verification, and reward distribution
 */
contract ClosedSurveyV6 is Ownable, Pausable {
    using ECDSA for bytes32;

    /**
     * @notice Reference to the ERC20 token contract used for participant rewards
     * @dev Marked as immutable to save gas and prevent changes after deployment
     */
    IERC20Metadata public immutable rewardToken;

    /**
     * @notice Mapping to track participants who have received rewards
     * @dev Used to prevent double-claiming of rewards
     */
    mapping(address => bool) private rewardedParticipants;

    /**
     * @notice Mapping to track participants who have been screened for the survey
     * @dev Screening is a prerequisite for reward claiming
     */
    mapping(address => bool) private participantsScreenedForSurvey;

    /**
     * @notice Mapping to track which signatures have been used for screening participants
     * @dev Prevents replay attacks by ensuring each signature is only used once
     */
    mapping(bytes => bool) private signaturesUsedForScreening;

    /**
     * @notice Mapping to track which signatures have been used for claiming rewards
     * @dev Prevents replay attacks by ensuring each signature is only used once
     */
    mapping(bytes => bool) private signaturesUsedForClaiming;

    /**
     * @notice Amount of the reward token to reward each participant
     * @dev Stored in the token's smallest unit (wei equivalent)
     */
    uint256 public rewardAmountPerParticipantInWei;

    /**
     * @notice Maximum number of participants allowed in the survey
     * @dev Used to limit the total number of rewards that can be distributed
     */
    uint256 public targetNumberOfParticipants;

    /**
     * @notice Counter for number of participants who have been rewarded
     * @dev Used to track progress toward the target number of participants
     */
    uint256 private numberOfRewardedParticipants;

    /**
     * @notice Counter for number of rewards that have been claimed
     * @dev Should match numberOfRewardedParticipants but tracked separately for verification
     */
    uint256 private numberOfClaimedRewards;

    /**
     * @notice Counter for number of participants who have been screened
     * @dev Tracks the total number of successful screenings
     */
    uint256 public numberOfScreenedParticipants;

    /**
     * @notice Counter for number of screening signatures that have been used
     * @dev For monitoring signature usage and preventing replay attacks
     */
    uint256 public numberOfUsedScreeningSignatures;

    /**
     * @notice Counter for number of claiming signatures that have been used
     * @dev For monitoring signature usage and preventing replay attacks
     */
    uint256 public numberOfUsedClaimingSignatures;

    /**
     * @notice Emitted when a participant completes the screening process
     * @param participant The address of the screened participant
     * @dev Used for off-chain tracking and verification of the screening process
     */
    event ParticipantScreened(address participant);

    /**
     * @notice Emitted when a participant successfully claims their reward
     * @param participant The address of the rewarded participant
     * @param rewardAmount The amount of reward token rewarded in wei
     * @dev Provides transparency for successful reward distributions
     */
    event ParticipantRewarded(address participant, uint256 rewardAmount);

    /**
     * @notice Emitted when a signature is used to screen a participant
     * @param signature The signature that was used
     * @param participant The address of the participant who used the signature
     * @dev Helps track signature usage for audit and debugging purposes
     */
    event ScreeningSignatureUsed(bytes signature, address participant);

    /**
     * @notice Emitted when a signature is used to claim a reward
     * @param signature The signature that was used
     * @param participant The address of the participant who used the signature
     * @dev Helps track signature usage for audit and debugging purposes
     */
    event ClaimingSignatureUsed(bytes signature, address participant);

    /**
     * @notice Emitted when a participant is marked as having received their reward
     * @param participant The address of the participant marked as rewarded
     * @dev Used for tracking the internal state change separate from the token transfer
     */
    event ParticipantMarkedAsRewarded(address participant);

    /**
     * @notice Emitted when reward funds are withdrawn by the researcher
     * @param researcher The address of the researcher who withdrew the funds
     * @param rewardAmount The amount of reward token withdrawn in wei
     * @dev Provides transparency for fund withdrawals by the researcher
     */
    event RewardTokenWithdrawn(address researcher, uint256 rewardAmount);

    /**
     * @notice Emitted when a given token is withdrawn by the researcher
     * @param researcher The address of the researcher who withdrew the funds
     * @param tokenAddress The address of the given token withdrawn
     * @param rewardAmount The amount of the given token withdrawn in wei
     * @dev Allows withdrawal of any ERC20 tokens accidentally sent to the contract
     */
    event GivenTokenWithdrawn(
        address researcher,
        IERC20Metadata tokenAddress,
        uint256 rewardAmount
    );

    /**
     * @notice Emitted when the reward amount per participant is updated
     * @param oldRewardTokenRewardAmountPerParticipantInWei The previous reward amount
     * @param newRewardTokenRewardAmountPerParticipantInWei The new reward amount
     * @dev Provides transparency for configuration changes by the researcher
     */
    event RewardAmountUpdated(
        uint256 oldRewardTokenRewardAmountPerParticipantInWei,
        uint256 newRewardTokenRewardAmountPerParticipantInWei
    );

    /**
     * @notice Emitted when the target number of participants is updated
     * @param oldTargetNumberOfParticipants The previous target number
     * @param newTargetNumberOfParticipants The new target number
     * @dev Provides transparency for configuration changes by the researcher
     */
    event TargetNumberOfParticipantsUpdated(
        uint256 oldTargetNumberOfParticipants,
        uint256 newTargetNumberOfParticipants
    );

    /**
     * @notice Verifies that the screening signature is valid and was signed by the contract owner
     * @dev Used to validate researcher-approved screening attempts
     * @param participant The wallet address of the participant being screened
     * @param surveyId Unique identifier for this survey instance
     * @param nonce Unique number to prevent replay attacks
     * @param signature Cryptographic signature generated by the contract owner
     */
    modifier onlyIfGivenScreeningSignatureIsValid(
        address participant,
        string memory surveyId,
        uint256 nonce,
        bytes memory signature
    ) {
        require(
            verifySignatureForParticipantScreening(
                participant,
                surveyId,
                nonce,
                signature
            ),
            "Invalid signature"
        );
        _;
    }

    /**
     * @notice Verifies that the claiming signature is valid and was signed by the contract owner
     * @dev Used to validate researcher-approved reward claims
     * @param participant The wallet address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent replay attacks
     * @param signature Cryptographic signature generated by the contract owner
     */
    modifier onlyIfGivenClaimingSignatureIsValid(
        address participant,
        string memory rewardId,
        uint256 nonce,
        bytes memory signature
    ) {
        require(
            verifySignatureForRewardClaiming(
                participant,
                rewardId,
                nonce,
                signature
            ),
            "Invalid signature"
        );
        _;
    }

    /**
     * @notice Ensures a screening signature hasn't been used before
     * @dev Prevents replay attacks by checking signature uniqueness
     * @param signature The cryptographic signature to check
     */
    modifier onlyIfGivenScreeningSignatureIsUnused(bytes memory signature) {
        require(
            !signaturesUsedForScreening[signature],
            "Signature already used"
        );
        _;
    }

    /**
     * @notice Ensures a claiming signature hasn't been used before
     * @dev Prevents replay attacks by checking signature uniqueness
     * @param signature The cryptographic signature to check
     */
    modifier onlyIfGivenClaimingSignatureIsUnused(bytes memory signature) {
        require(
            !signaturesUsedForClaiming[signature],
            "Signature already used"
        );
        _;
    }

    /**
     * @notice Ensures participant hasn't been screened yet
     * @dev Prevents duplicate screenings for the same participant
     * @param participant Address of the participant to check
     */
    modifier onlyUnscreenedParticipant(address participant) {
        require(
            !participantsScreenedForSurvey[participant],
            "Only unscreened address"
        );
        _;
    }

    /**
     * @notice Ensures the participant has been screened before proceeding
     * @dev Enforces the proper sequence of operations (screen first, then claim)
     * @param participant Address of the participant to check
     */
    modifier mustBeScreened(address participant) {
        require(participantsScreenedForSurvey[participant], "Must be screened");
        _;
    }

    /**
     * @notice Ensures participant hasn't already claimed a reward
     * @dev Prevents double rewards for the same participant
     * @param participant Address of the participant to check
     */
    modifier onlyUnrewardedParticipant(address participant) {
        require(
            !rewardedParticipants[participant],
            "Participant already rewarded"
        );
        _;
    }

    /**
     * @notice Ensures the function caller is the specified participant
     * @dev Prevents unauthorized calls on behalf of other participants
     * @param participant Address that should match msg.sender
     */
    modifier onlyIfSenderIsGivenParticipant(address participant) {
        require(msg.sender == participant, "Only valid sender");
        _;
    }

    /**
     * @notice Ensures the contract has sufficient reward tokens for one reward
     * @dev Prevents failed token transfers due to insufficient balance
     */
    modifier onlyIfContractHasEnoughRewardTokens() {
        require(
            rewardToken.balanceOf(address(this)) >=
                rewardAmountPerParticipantInWei,
            "Contract does not have enough of the reward token"
        );
        _;
    }

    /**
     * @notice Ensures the contract has at least some reward tokens
     * @dev Used for withdrawal functions to prevent zero-value transfers
     */
    modifier onlyIfContractHasAnyRewardTokens() {
        require(
            rewardToken.balanceOf(address(this)) > 0,
            "Contract does not have any reward tokens"
        );
        _;
    }

    /**
     * @notice Ensures the contract has at least some of the specified token
     * @dev Used for withdrawal of any token to prevent zero-value transfers
     * @param token The ERC20 token contract to check balance for
     */
    modifier onlyIfContractHasAnyGivenToken(IERC20Metadata token) {
        require(
            token.balanceOf(address(this)) > 0,
            "Contract does not have any of the given token"
        );
        _;
    }

    /**
     * @notice Ensures the target number of participants hasn't been reached
     * @dev Controls the total number of rewards that can be distributed
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
     * @dev Sets up the contract with researcher address, reward amount, participant target, and reward token
     * @param researcher Address of the researcher who will own and manage the contract
     * @param _rewardAmountPerParticipantInWei Amount in wei to reward each participant
     * @param _targetNumberOfParticipants Maximum number of participants for the survey
     * @param _rewardToken Address of the ERC20 token contract used for rewards
     */
    constructor(
        address researcher,
        uint256 _rewardAmountPerParticipantInWei,
        uint256 _targetNumberOfParticipants,
        address _rewardToken
    ) Ownable(researcher) {
        require(
            _rewardToken != address(0),
            "Zero address given for reward Token"
        );

        require(researcher != address(0), "Zero address given for researcher");

        require(_rewardAmountPerParticipantInWei > 0, "Invalid reward amount");

        require(
            _targetNumberOfParticipants > 0,
            "Invalid number of target participants"
        );

        rewardToken = IERC20Metadata(_rewardToken);

        rewardAmountPerParticipantInWei = _rewardAmountPerParticipantInWei;
        targetNumberOfParticipants = _targetNumberOfParticipants;
    }

    /**
     * @notice Registers a participant as screened for the survey
     * @dev Marks the participant as eligible to claim rewards if they pass screening
     * @param participant Address of the participant to screen
     * @param surveyId Unique identifier for this survey instance
     * @param nonce Unique number to prevent replay attacks
     * @param signature Cryptographic signature from the contract owner
     */
    function screenParticipant(
        address participant,
        string memory surveyId,
        uint256 nonce,
        bytes memory signature
    )
        external
        whenNotPaused
        onlyIfSenderIsGivenParticipant(participant)
        onlyWhenAllParticipantsHaveNotBeenRewarded
        onlyUnscreenedParticipant(participant)
        onlyUnrewardedParticipant(participant)
        onlyIfGivenScreeningSignatureIsValid(
            participant,
            surveyId,
            nonce,
            signature
        )
        onlyIfGivenScreeningSignatureIsUnused(signature)
    {
        require(participant != address(0), "Zero address passed");

        participantsScreenedForSurvey[participant] = true;

        unchecked {
            ++numberOfScreenedParticipants;
        }

        markScreeningSignatureAsHavingBeenUsed(signature, participant);

        emit ParticipantScreened(participant);
    }

    /**
     * @notice Creates a hash for screening signature verification
     * @dev Combines contract-specific data with participant info to prevent cross-contract replay attacks
     * @param participant The wallet address of the participant being screened
     * @param surveyId A unique identifier for this specific survey
     * @param nonce Unique number to prevent replay attacks
     * @return bytes32 The keccak256 hash of the packed parameters
     *
     * The hash includes:
     * 1. Contract address - Prevents cross-contract replay
     * 2. Chain ID - Prevents cross-chain replay
     * 3. Participant address - Links signature to specific participant
     * 4. SurveyId - Links signature to specific survey
     * 5. Nonce - Ensures uniqueness of each signature
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
     * @notice Creates a hash for reward claiming signature verification
     * @dev Combines contract-specific data with participant info to prevent cross-contract replay attacks
     * @param participant The wallet address of the participant claiming the reward
     * @param rewardId A unique identifier for this specific reward claim
     * @param nonce Unique number to prevent replay attacks
     * @return bytes32 The keccak256 hash of the packed parameters
     *
     * The hash includes:
     * 1. Contract address - Prevents cross-contract replay
     * 2. Chain ID - Prevents cross-chain replay
     * 3. Participant address - Links signature to specific participant
     * 4. RewardId - Links signature to specific reward
     * 5. Nonce - Ensures uniqueness of each signature
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
     * @notice Verifies that a signature is valid for participant screening
     * @dev Recovers the signer from the signature and compares with contract owner
     * @param participant Address of the participant being screened
     * @param surveyId Unique identifier for this screening
     * @param nonce Unique number to prevent replay attacks
     * @param signature Cryptographic signature to verify
     * @return bool True if signature was signed by the contract owner, false otherwise
     */
    function verifySignatureForParticipantScreening(
        address participant,
        string memory surveyId,
        uint256 nonce,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 messageHash = getMessageHashForParticipantScreening(
            participant,
            surveyId,
            nonce
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ethSignedMessageHash.recover(signature) == owner();
    }

    /**
     * @notice Verifies that a signature is valid for reward claiming
     * @dev Recovers the signer from the signature and compares with contract owner
     * @param participant Address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent replay attacks
     * @param signature Cryptographic signature to verify
     * @return bool True if signature was signed by the contract owner, false otherwise
     */
    function verifySignatureForRewardClaiming(
        address participant,
        string memory rewardId,
        uint256 nonce,
        bytes memory signature
    ) private view returns (bool) {
        bytes32 messageHash = getMessageHashForRewardClaiming(
            participant,
            rewardId,
            nonce
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        return ethSignedMessageHash.recover(signature) == owner();
    }

    /**
     * @notice Processes a participant's reward claim with signature verification
     * @dev Handles the entire reward claim workflow with multiple security checks
     * @param participant Address of the participant claiming the reward
     * @param rewardId Unique identifier for this reward claim
     * @param nonce Unique number to prevent replay attacks
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
        onlyIfSenderIsGivenParticipant(participant)
        onlyWhenAllParticipantsHaveNotBeenRewarded
        onlyUnrewardedParticipant(participant)
        mustBeScreened(participant)
        onlyIfGivenClaimingSignatureIsValid(
            participant,
            rewardId,
            nonce,
            signature
        )
        onlyIfGivenClaimingSignatureIsUnused(signature)
        onlyIfContractHasEnoughRewardTokens
    {
        bool rewardTransferIsSuccesful = rewardParticipant(participant);

        if (rewardTransferIsSuccesful) {
            markClaimingSignatureAsHavingBeenUsed(signature, participant);
            markParticipantAsHavingClaimedReward(participant);
        }
    }

    /**
     * @notice Transfers reward tokens to a participant
     * @dev Internal function to handle the actual token transfer
     * @param participant Address of the participant to reward
     * @return bool True if the token transfer was successful
     */
    function rewardParticipant(address participant) private returns (bool) {
        bool rewardTransferIsSuccesful = rewardToken.transfer(
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
     * @notice Updates internal state to mark a participant as having claimed their reward
     * @dev Called after successful token transfer to update tracking data
     * @param participant The address of the participant who claimed the reward
     */
    function markParticipantAsHavingClaimedReward(address participant) private {
        rewardedParticipants[participant] = true;

        unchecked {
            ++numberOfClaimedRewards;
        }
        emit ParticipantMarkedAsRewarded(participant);
    }

    /**
     * @notice Updates internal state to mark a screening signature as used
     * @dev Prevents signature reuse in future survey screenings
     * @param signature The signature to mark as used
     * @param participant The address of the participant who used the signature
     */
    function markScreeningSignatureAsHavingBeenUsed(
        bytes memory signature,
        address participant
    ) private {
        signaturesUsedForScreening[signature] = true;
        unchecked {
            ++numberOfUsedScreeningSignatures;
        }
        emit ScreeningSignatureUsed(signature, participant);
    }

    /**
     * @notice Updates internal state to mark a claiming signature as used
     * @dev Prevents signature reuse in future reward claims
     * @param signature The signature to mark as used
     * @param participant The address of the participant who used the signature
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
     * @notice Allows the researcher to withdraw all remaining reward tokens
     * @dev Transfers the entire contract balance of reward tokens to the owner
     */
    function withdrawAllRewardTokenToResearcher()
        external
        onlyOwner
        whenNotPaused
        onlyIfContractHasAnyRewardTokens
    {
        uint256 balance = rewardToken.balanceOf(address(this));
        bool transferIsSuccessful = rewardToken.transfer(owner(), balance);

        if (transferIsSuccessful) {
            emit RewardTokenWithdrawn(owner(), balance);
        }
    }

    /**
     * @notice Allows the researcher to withdraw any ERC20 token from the contract
     * @dev Useful for recovering tokens accidentally sent to the contract
     * @param token The ERC20 token contract to withdraw tokens from
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
     * @notice Updates the reward amount given to each participant
     * @dev Can be adjusted by the researcher to respond to token price changes
     * @param _newRewardAmountPerParticipantInWei New reward amount in token's smallest unit (wei)
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
     * @notice Updates the maximum number of participants allowed in the survey
     * @dev Can only increase the target number, never decrease it
     * @param _newTargetNumberOfParticipants New maximum number of participants
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
     * @notice Temporarily halts all reward claims and withdrawals
     * @dev Used in emergency situations or when issues are detected
     */
    function pauseSurvey() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes normal contract operations after a pause
     * @dev Enables reward claims and withdrawals to proceed again
     */
    function unpauseSurvey() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Checks if a participant has completed the screening process
     * @dev Public view function for off-chain status checks
     * @param participant Address of the participant to check
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
     * @notice Checks if a participant has received their reward
     * @dev Public view function for off-chain status checks
     * @param participant Address of the participant to check
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
     * @notice Checks if a signature has been used for claiming a reward
     * @dev Public view function for signature validation
     * @param signature Cryptographic signature to check
     * @return bool True if the signature has already been used
     */
    function checkIfSignatureIsUsed(bytes memory signature)
        external
        view
        returns (bool)
    {
        return signaturesUsedForClaiming[signature];
    }

    /**
     * @notice Checks if the contract is currently paused
     * @dev Used to determine if operations are currently halted
     * @return bool True if the contract is paused, false otherwise
     */
    function checkIfContractIsPaused() external view returns (bool) {
        return paused();
    }

    /**
     * @notice Gets the current balance of reward tokens in the contract
     * @dev Indicates how many more rewards can be distributed
     * @return uint256 The current reward token balance in wei
     */
    function getRewardTokenContractBalanceAmount()
        external
        view
        returns (uint256)
    {
        return rewardToken.balanceOf(address(this));
    }

    /**
     * @notice Gets the contract address of the reward token
     * @dev Returns the ERC20 token interface used for rewards
     * @return IERC20Metadata The ERC20 interface of the reward token
     */
    function getRewardTokenContractAddress()
        external
        view
        returns (IERC20Metadata)
    {
        return rewardToken;
    }

    /**
     * @notice Gets the current reward amount per participant
     * @dev Returns the exact amount each participant will receive
     * @return uint256 The reward amount in token's smallest unit (wei)
     */
    function getRewardAmountPerParticipantInWei()
        external
        view
        returns (uint256)
    {
        return rewardAmountPerParticipantInWei;
    }

    /**
     * @notice Gets the current count of rewarded participants
     * @dev Used to track progress toward the target
     * @return uint256 The number of participants who have received rewards
     */
    function getNumberOfRewardedParticipants() external view returns (uint256) {
        return numberOfRewardedParticipants;
    }

    /**
     * @notice Gets the maximum number of participants for the survey
     * @dev Used to determine when the survey is complete
     * @return uint256 The target number of participants
     */
    function getTargetNumberOfParticipants() external view returns (uint256) {
        return targetNumberOfParticipants;
    }

    /**
     * @notice Gets the number of participants who have completed screening
     * @dev Indicates how many participants are eligible to claim rewards
     * @return uint256 The count of screened participants
     */
    function getNumberOfScreenedParticipants() external view returns (uint256) {
        return numberOfScreenedParticipants;
    }

    /**
     * @notice Gets the number of screening signatures that have been used
     * @dev Used for tracking and auditing signature usage
     * @return uint256 The count of used screening signatures
     */
    function getNumberOfUsedScreeningSignatures()
        external
        view
        returns (uint256)
    {
        return numberOfUsedScreeningSignatures;
    }

    /**
     * @notice Gets the number of claiming signatures that have been used
     * @dev Used for tracking and auditing signature usage
     * @return uint256 The count of used claiming signatures
     */
    function getNumberOfUsedClaimingSignatures()
        external
        view
        returns (uint256)
    {
        return numberOfUsedClaimingSignatures;
    }

    /**
     * @notice Gets the count of rewards that have been successfully claimed
     * @dev Should match numberOfRewardedParticipants if all operations are successful
     * @return uint256 The number of claimed rewards
     */
    function getNumberOfClaimedRewards() external view returns (uint256) {
        return numberOfClaimedRewards;
    }

    /**
     * @notice Gets the address of the contract owner (researcher)
     * @dev The owner has special permissions to manage the survey
     * @return address The researcher's address
     */
    function getOwner() external view returns (address) {
        return owner();
    }
}
