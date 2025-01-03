const { starknet } = require('hardhat');
require('dotenv').config();

async function main() {
    console.log('Starting deployment...');

    try {
        // Get deployer account
        const [deployer] = await starknet.getSigners();
        console.log(`Deploying contracts with account: ${deployer.address}`);

        // Deploy VotingSystem
        console.log('Deploying VotingSystem...');
        const VotingSystem = await starknet.getContractFactory('VotingSystem');
        const votingSystem = await VotingSystem.deploy(deployer.address);
        await votingSystem.deployed();
        console.log(`VotingSystem deployed to: ${votingSystem.address}`);

        // Deploy BallotFactory
        console.log('Deploying BallotFactory...');
        const BallotFactory = await starknet.getContractFactory('BallotFactory');
        const ballotFactory = await BallotFactory.deploy(deployer.address);
        await ballotFactory.deployed();
        console.log(`BallotFactory deployed to: ${ballotFactory.address}`);

        // Initialize Calimero integration
        console.log('Initializing Calimero integration...');
        const calimeroConfig = {
            apiKey: process.env.CALIMERO_API_KEY,
            networkId: process.env.CALIMERO_NETWORK_ID,
            endpoint: process.env.CALIMERO_ENDPOINT
        };

        // Verify contracts
        if (process.env.STARKNET_NETWORK !== 'localhost') {
            console.log('Verifying contracts...');
            await starknet.verifyContract({
                address: votingSystem.address,
                constructorArguments: [deployer.address],
            });
            await starknet.verifyContract({
                address: ballotFactory.address,
                constructorArguments: [deployer.address],
            });
        }

        // Generate deployment info
        const deploymentInfo = {
            network: process.env.STARKNET_NETWORK,
            votingSystem: votingSystem.address,
            ballotFactory: ballotFactory.address,
            deployer: deployer.address,
            timestamp: new Date().toISOString()
        };

        // Save deployment info
        const fs = require('fs');
        fs.writeFileSync(
            './deployment-info.json',
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log('Deployment completed successfully!');
        console.log('Deployment info saved to deployment-info.json');

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
