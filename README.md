# Canvassing - Participant: Online Surveys, Paid in Tokens
> online surveys that reward participants for answering questions, built on Celo

![Canvassing GitHub Header](https://github.com/user-attachments/assets/7646cfa2-8172-44d4-9639-b9227a405bfa)


## What is Canvassing?
A Next.js-based Web3 application that bring surveys to participants (active Celo wallet addresses), and uses a smart contract to distribute rewards.
## How It Works

### 1. Survey Booking
Participants perform an on-chain booking of a survey to secure their reward and do the survey at their own time.

### 2. Automated Rewarding
Once a [Participant] completes a surveys (e.g. submits a form), an off-chain signature is created to help them claim from the smart contract.

### 3. Secure Smart Contract Transactions
[`ClosedSurveyV6.sol`](https://github.com/andrewkimjoseph/canvassing-participant/blob/main/hardhat/contracts/ClosedSurveyV6.sol) is a secure Solidity smart contract that manages value by ensuring only the right person gets a reward.


## Features

- Survey Booking
- Automated Rewarding
- Secure Smart Contract Transactions

## Tech Stack

- **Frontend**: Next.js
- **Authentication**: Firebase Anonymous Authentication
- **Database**: Firestore Database (NoSQL)
- **Blockchain**: Celo Network (Mainnet)
- **Smart Contracts**: Solidity (OpenZeppelin Ownable, IERC20Metadata, Pausable, ECDSA, MessageHashUtils)


## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- npm or yarn

### Quick Start
1. Clone and install:
```bash
git clone https://github.com/andrewkimjoseph/canvassing-participant
cd canvassing-participant
npm install  # or yarn install
```

2. Configure environment:
Create `.env` file with the following:
```env
NEXT_PUBLIC_AMPLITUDE_API_KEY=""
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_RPC_API_KEY=""
SENTRY_AUTH_TOKEN=""
NEXT_PUBLIC_REOWN_PROJECT_ID=""
```

Or copy the `.env.example` file

```bash
cp .env.example .env
```

3. Launch development server (front-end):
```bash
cd front-end
npm run dev  # or yarn dev
```