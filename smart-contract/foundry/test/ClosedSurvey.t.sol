// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/ClosedSurvey.sol";

contract ClosedSurveyTest is Test {
    ClosedSurvey public closedSurvey;
    IERC20 public cUSD;

    // Test addresses
    address public researcher;
    address public participant1;
    address public participant2;
    address public participant3;

    // Celo testnet cUSD address
    address public constant CUSD_ADDRESS = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    // Constants for testing
    uint256 public constant REWARD_AMOUNT = 2 ether;
    uint256 public constant TARGET_PARTICIPANTS = 3;
    uint256 public constant INITIAL_BALANCE = 100 ether;

    function setUp() public {
        // Setup accounts
        researcher = makeAddr("researcher");
        participant1 = makeAddr("participant1");
        participant2 = makeAddr("participant2");
        participant3 = makeAddr("participant3");

        // Create a fork of Celo testnet
        vm.createSelectFork(vm.rpcUrl("celo_testnet"));

        // Use the actual cUSD token on Celo testnet
        cUSD = IERC20(CUSD_ADDRESS);

        // Deploy contract
        vm.prank(researcher);
        closedSurvey = new ClosedSurvey(
            researcher, 
            REWARD_AMOUNT, 
            TARGET_PARTICIPANTS, 
            address(cUSD)
        );

        // Fund the researcher with some cUSD for testing
        vm.prank(0x874069Fa1EB16D44d622F2e0Ca25eeA172369bC1); // cUSD contract owner
        cUSD.transfer(researcher, REWARD_AMOUNT * TARGET_PARTICIPANTS);

        // Transfer funds to the contract
        vm.prank(researcher);
        cUSD.transfer(address(closedSurvey), REWARD_AMOUNT * TARGET_PARTICIPANTS);
    }

    function testConstructor() public view {
        assertEq(address(closedSurvey.cUSD()), address(cUSD), "cUSD address mismatch");
        assertEq(closedSurvey.rewardAmountPerParticipantInWei(), REWARD_AMOUNT, "Reward amount mismatch");
        assertEq(closedSurvey.targetNumberOfParticipants(), TARGET_PARTICIPANTS, "Target participants mismatch");
        assertEq(closedSurvey.owner(), researcher, "Owner address mismatch");
    }

    function testWhitelistSingleUser() public {
        vm.prank(researcher);
        closedSurvey.whitelistOneUserAddress(participant1);

        assertTrue(closedSurvey.checkIfUserAddressIsWhitelisted(participant1), "User not whitelisted");
        assertEq(closedSurvey.getNumberOfWhitelistedUserAddresses(), 1, "Incorrect whitelisted count");
    }

    function testProcessRewardClaim() public {
        // Whitelist participant
        vm.prank(researcher);
        closedSurvey.whitelistOneUserAddress(participant1);

        // Record initial balance
        uint256 initialBalance = cUSD.balanceOf(participant1);

        // Claim reward as participant
        vm.prank(participant1);
        closedSurvey.processRewardClaimByParticipant(participant1);

        // Check reward received
        uint256 finalBalance = cUSD.balanceOf(participant1);
        assertEq(finalBalance, initialBalance + REWARD_AMOUNT, "Incorrect reward amount");
        assertTrue(closedSurvey.checkIfParticipantHasAlreadyClaimedReward(participant1), "Participant not marked as rewarded");
    }

    function testCannotProcessRewardTwice() public {
        // Whitelist participant
        vm.prank(researcher);
        closedSurvey.whitelistOneUserAddress(participant1);

        // First claim works
        vm.prank(participant1);
        closedSurvey.processRewardClaimByParticipant(participant1);

        // Second claim should revert
        vm.prank(participant1);
        vm.expectRevert(abi.encodeWithSelector(ClosedSurvey.ParticipantAlreadyRewarded.selector, participant1));
        closedSurvey.processRewardClaimByParticipant(participant1);
    }

    function testWithdrawRewardFunds() public {
        // Whitelist participants
        address[] memory participants = new address[](3);
        participants[0] = participant1;
        participants[1] = participant2;
        participants[2] = participant3;

        vm.prank(researcher);
        closedSurvey.whitelistMultipleUserAddresses(participants);

        // Record initial contract balance
        uint256 initialContractBalance = cUSD.balanceOf(address(closedSurvey));

        // Withdraw funds
        vm.prank(researcher);
        closedSurvey.withdrawAllRewardFundsToResearcher();

        // Check balances
        assertEq(cUSD.balanceOf(address(closedSurvey)), 0, "Contract balance not zero");
        assertEq(cUSD.balanceOf(researcher), initialContractBalance, "Incorrect withdrawal amount");
    }

    // Negative test cases
    function testCannotWhitelistZeroAddress() public {
        vm.prank(researcher);
        vm.expectRevert(ClosedSurvey.ZeroAddress.selector);
        closedSurvey.whitelistOneUserAddress(address(0));
    }

    function testPauseUnpauseSurvey() public {
        vm.prank(researcher);
        closedSurvey.pauseSurvey();

        // Attempt to whitelist should revert
        vm.prank(researcher);
        vm.expectRevert("Pausable: paused");
        closedSurvey.whitelistOneUserAddress(participant1);

        // Unpause
        vm.prank(researcher);
        closedSurvey.unpauseSurvey();

        // Now whitelisting should work
        vm.prank(researcher);
        closedSurvey.whitelistOneUserAddress(participant1);
        assertTrue(closedSurvey.checkIfUserAddressIsWhitelisted(participant1), "User not whitelisted after unpause");
    }
}