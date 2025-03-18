# Canvassing - Participant | Hardhat (with viem)

## Overview
This project provides a robust environment for building, testing, and deploying smart contracts for the Canvassing - Participant application using Hardhat and viem. It is designed to streamline blockchain development on the Celo Alfajores / mainnet network.

## Tech Stack
- **Smart Contract Development**: Hardhat
- **Testing Framework**: Hardhat Test
- **Blockchain Interaction**: viem
- **Network**: Celo (Alfajores / mainnet)
- **Language**: Solidity
- **Type Safety**: TypeScript

## Features
- Complete local development environment
- Automated testing setup
- Gas optimization tools
- TypeScript support
- viem for type-safe blockchain interactions
- Pre-configured for Celo deployment

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- Basic knowledge of Solidity and Ethereum/Celo development

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andrewkimjoseph/canvassing-participant.git
cd canvassing-participant/hardhat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit your `.env` file with your specific configuration values.

## Usage

### Compiling Contracts
```bash
npx hardhat clean
npx hardhat compile
```

### Running Tests
```bash
npx hardhat test test/ClosedSurveyV6.ts
```

### Deployment and Verification to Celo
Deploy to Celo Alfajores testnet:
```bash
npx hardhat ignition deploy ignition/modules/ClosedSurveyV6.ts --network celoAlfajores --verify
```

Deploy to Celo mainnet:
```bash
npx hardhat ignition deploy ignition/modules/ClosedSurveyV6.ts --network celo --verify
```

### Verification on Celo (Custom Scripts)
Verification to Celo Alfajores testnet:
```bash
cd scripts/
chmod u+x ./verify_testnet.sh
./verify_testnet.sh <contract-address>
```

Verification to Celo mainnet:
```bash
cd scripts/
chmod u+x ./verify_mainnet.sh
./verify_mainnet.sh <contract-address>
```

## Project Structure
```
├── contracts/             # Smart contracts
├── scripts/               # Deployment, testing, verifying scripts (custom)
├── test/                  # Test files
├── hardhat.config.ts      # Hardhat configuration
└── tsconfig.json          # TypeScript configuration
```

## Advanced Configuration
Check the `hardhat.config.ts` file for advanced configuration options, including:
- Gas reporter settings
- Network configurations
- Compiler options
- Plugin settings

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.