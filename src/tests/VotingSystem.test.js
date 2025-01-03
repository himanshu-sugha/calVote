const { expect } = require('chai');
const { starknet } = require('hardhat');
const { VotingSystem } = require('../contracts/VotingSystem');
const { ZKVoteProof } = require('../lib/zkProofs');
const { VoterRegistry } = require('../lib/voterRegistry');

describe('VotingSystem', () => {
    let votingSystem;
    let ballotFactory;
    let admin;
    let voter1;
    let voter2;
    let zkProofs;
    let voterRegistry;

    beforeEach(async () => {
        [admin, voter1, voter2] = await starknet.getSigners();

        // Deploy contracts
        const VotingSystemFactory = await starknet.getContractFactory('VotingSystem');
        votingSystem = await VotingSystemFactory.deploy(admin.address);

        const BallotFactoryFactory = await starknet.getContractFactory('BallotFactory');
        ballotFactory = await BallotFactoryFactory.deploy(admin.address);

        // Initialize helpers
        zkProofs = new ZKVoteProof({
            // Test configuration
        });

        voterRegistry = new VoterRegistry({
            // Test configuration
        });
    });

    describe('Ballot Creation', () => {
        it('should allow admin to create a ballot', async () => {
            const ballot = {
                title: 'Test Ballot',
                description: 'Test Description',
                startTime: Math.floor(Date.now() / 1000),
                endTime: Math.floor(Date.now() / 1000) + 86400,
                options: ['Option 1', 'Option 2']
            };

            await expect(
                ballotFactory.connect(admin).createBallot(
                    ballot.title,
                    ballot.description,
                    ballot.startTime,
                    ballot.endTime,
                    ballot.options
                )
            ).to.emit(ballotFactory, 'BallotCreated');

            const createdBallot = await ballotFactory.getBallot(1);
            expect(createdBallot.title).to.equal(ballot.title);
        });

        it('should not allow non-admin to create ballot', async () => {
            await expect(
                ballotFactory.connect(voter1).createBallot(
                    'Test',
                    'Test',
                    0,
                    1,
                    ['Option']
                )
            ).to.be.revertedWith('Only admin');
        });
    });

    describe('Voter Registration', () => {
        it('should register voter with valid credentials', async () => {
            const result = await voterRegistry.registerVoter(
                voter1.address,
                'testPublicKey'
            );

            expect(result.voterId).to.exist;
            expect(result.credential).to.exist;

            const isRegistered = await voterRegistry.verifyVoterCredential(
                result.voterId,
                result.credential
            );
            expect(isRegistered).to.be.true;
        });
    });

    describe('Vote Casting', () => {
        let ballotId;
        let voterCredential;

        beforeEach(async () => {
            // Create ballot
            const tx = await ballotFactory.connect(admin).createBallot(
                'Test',
                'Test',
                Math.floor(Date.now() / 1000),
                Math.floor(Date.now() / 1000) + 86400,
                ['Option 1', 'Option 2']
            );
            const receipt = await tx.wait();
            ballotId = receipt.events[0].args.ballotId;

            // Register voter
            const registration = await voterRegistry.registerVoter(
                voter1.address,
                'testPublicKey'
            );
            voterCredential = registration.credential;
        });

        it('should allow registered voter to cast vote', async () => {
            // Create vote commitment
            const commitment = await zkProofs.createVoteCommitment(
                'Option 1',
                'voterSecret'
            );

            // Generate proofs
            const eligibilityProof = await zkProofs.generateEligibilityProof(
                voter1.address,
                {}
            );
            const voteProof = await zkProofs.generateVoteProof(
                'Option 1',
                commitment
            );
            const aggregatedProof = await zkProofs.aggregateProofs([
                eligibilityProof,
                voteProof
            ]);

            await expect(
                votingSystem.connect(voter1).castVote(commitment, aggregatedProof)
            ).to.emit(votingSystem, 'VoteCast');
        });

        it('should not allow double voting', async () => {
            const commitment = await zkProofs.createVoteCommitment(
                'Option 1',
                'voterSecret'
            );
            const proof = await zkProofs.generateVoteProof(
                'Option 1',
                commitment
            );

            await votingSystem.connect(voter1).castVote(commitment, proof);

            await expect(
                votingSystem.connect(voter1).castVote(commitment, proof)
            ).to.be.revertedWith('Already voted');
        });
    });
});
