export const canvassingSurveyContractABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'researcherWalletAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_rewardAmountPerParticipantInWei',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_targetNumberOfParticipants',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'cUSDTokenAddress',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AllParticipantsRewarded',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EnforcedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ExpectedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InsufficientContractBalance',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidArrayLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidNumberOfTargetParticipants',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidRewardAmountGiven',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NoRewardFunds',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'ParticipantAlreadyRewarded',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RewardTransferFailed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'UserAddressAlreadyWhitelisted',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'UserAddressNotWhitelisted',
    type: 'error',
  },
  {
    inputs: [],
    name: 'WithdrawalFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ZeroAddress',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'walletAddresses',
        type: 'address[]',
      },
    ],
    name: 'MultipleUserAddressesWhitelisted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address[]',
        name: 'walletAddresses',
        type: 'address[]',
      },
    ],
    name: 'MultipleWhitelistedUserAddressesBlacklisted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'participantWalletAddress',
        type: 'address',
      },
    ],
    name: 'OneUserAddressWhitelisted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'participantWalletAddress',
        type: 'address',
      },
    ],
    name: 'OneWhitelistedUserAddressBlacklisted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'participantWalletAddress',
        type: 'address',
      },
    ],
    name: 'ParticipantMarkedAsRewarded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'participantWalletAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'rewardAmount',
        type: 'uint256',
      },
    ],
    name: 'ParticipantRewarded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldcUSDRewardAmountPerParticipantInWei',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newcUSDRewardAmountPerParticipantInWei',
        type: 'uint256',
      },
    ],
    name: 'RewardAmountUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'researcherWalletAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'rewardAmount',
        type: 'uint256',
      },
    ],
    name: 'RewardFundsWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldTargetNumberOfParticipants',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newTargetNumberOfParticipants',
        type: 'uint256',
      },
    ],
    name: 'TargetNumberOfParticipantsUpdates',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'walletAddresses',
        type: 'address[]',
      },
    ],
    name: 'blacklistMultipleWhitelistedAddresses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'blacklistOneWhitelistedAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cUSD',
    outputs: [
      {
        internalType: 'contract IERC20Metadata',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'checkIfParticipantHasAlreadyClaimedReward',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'checkIfUserAddressIsBlacklisted',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'checkIfUserAddressIsWhitelisted',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNumberOfRewardedParticipants',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRewardAmountPerParticipantInWei',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'registeredAddresses',
        type: 'address[]',
      },
    ],
    name: 'getWhitelistedAddressesFromRegisteredAddresses',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'numberOfRewardedParticipants',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pauseSurvey',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'processRewardClaimByParticipant',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardAmountPerParticipantInWei',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'targetNumberOfParticipants',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpauseSurvey',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newRewardAmountPerParticipantInWei',
        type: 'uint256',
      },
    ],
    name: 'updateRewardAmountPerParticipant',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newTargetNumberOfParticipants',
        type: 'uint256',
      },
    ],
    name: 'updateTargetNumberOfParticipants',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'walletAddresses',
        type: 'address[]',
      },
    ],
    name: 'whitelistMultipleAddresses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'walletAddress',
        type: 'address',
      },
    ],
    name: 'whitelistOneAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawAllRewardFundsToResearcher',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
