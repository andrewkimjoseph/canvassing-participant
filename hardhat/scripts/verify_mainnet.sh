#!/bin/bash

# Check if contract address is provided
if [ -z "$1" ]
then
    echo "Error: Contract address is required"
    echo "Usage: ./verify_mainnet.sh <contract-address>"
    exit 1
fi

# Store contract address from first argument
CONTRACT_ADDRESS=$1

# Change directory up one level
cd ..

# Run verification command with provided contract address
npx hardhat verify --contract contracts/ClosedSurveyV6.sol:ClosedSurveyV6 --network celo $CONTRACT_ADDRESS --constructor-args constructorArgs.ts