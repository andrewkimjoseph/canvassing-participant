#!/bin/bash

cd ..
clear
npx hardhat clean
npx hardhat compile
npx hardhat test