require('@shardlabs/starknet-hardhat-plugin');
require('dotenv').config();

module.exports = {
    starknet: {
        network: process.env.STARKNET_NETWORK || 'testnet',
        venv: 'active',
        cairo1: true,
        dockerizedVersion: '0.12.0',
    },
    networks: {
        testnet: {
            url: 'https://alpha4.starknet.io',
        },
        mainnet: {
            url: 'https://alpha-mainnet.starknet.io',
        },
        devnet: {
            url: 'http://127.0.0.1:5050',
        },
    },
    paths: {
        artifacts: './artifacts',
        cache: './cache',
        sources: './src/contracts',
        tests: './src/tests',
    },
    mocha: {
        timeout: 60000,
    },
};
