const { starknet } = require('hardhat');
const { readFileSync } = require('fs');
require('dotenv').config();

async function main() {
    console.log('Starting contract verification...');

    try {
        // Read deployment info
        const deploymentInfo = JSON.parse(
            readFileSync('./deployment-info.json', 'utf8')
        );

        // Get deployer account
        const [deployer] = await starknet.getSigners();

        // Verify VotingSystem
        console.log('Verifying VotingSystem contract...');
        await starknet.verifyContract({
            address: deploymentInfo.votingSystem,
            constructorArguments: [deployer.address],
        });
        console.log('VotingSystem verified successfully');

        // Verify BallotFactory
        console.log('Verifying BallotFactory contract...');
        await starknet.verifyContract({
            address: deploymentInfo.ballotFactory,
            constructorArguments: [deployer.address],
        });
        console.log('BallotFactory verified successfully');

        console.log('All contracts verified successfully!');

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
