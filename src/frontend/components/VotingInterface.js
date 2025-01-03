import { useState, useEffect } from 'react';
import { useStarknet, useContract } from '@starknet-react/core';
import ZKVoteProof from '../../lib/zkProofs';
import { VoterRegistry } from '../../lib/voterRegistry';
import { ethers } from 'ethers';

const VotingInterface = ({ ballotId }) => {
    const { account } = useStarknet();
    const [ballot, setBallot] = useState(null);
    const [selectedOption, setSelectedOption] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize Calimero services
    const calimeroConfig = {
        networkId: process.env.NEXT_PUBLIC_CALIMERO_NETWORK_ID,
        endpoint: process.env.NEXT_PUBLIC_CALIMERO_ENDPOINT,
        apiKey: process.env.NEXT_PUBLIC_CALIMERO_API_KEY
    };

    const zkProofs = new ZKVoteProof(calimeroConfig);
    const voterRegistry = new VoterRegistry(calimeroConfig);

    useEffect(() => {
        if (account && ballotId) {
            loadBallotData();
            checkRegistration();
        }
    }, [account, ballotId]);

    const loadBallotData = async () => {
        try {
            setIsLoading(true);
            const contract = new Contract(votingSystemAbi, process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS);
            const ballotData = await contract.getBallot(ballotId);
            setBallot(ballotData);
        } catch (error) {
            setError('Error loading ballot: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const checkRegistration = async () => {
        if (!account) return;
        try {
            const isRegistered = await voterRegistry.checkVoterRegistration(account);
            setIsRegistered(isRegistered);
        } catch (error) {
            setError('Error checking registration: ' + error.message);
        }
    };

    const castVote = async () => {
        if (!account || !selectedOption || !ballot) return;
        
        try {
            setIsLoading(true);
            setError(null);

            // Generate voter secret
            const voterSecret = ethers.utils.randomBytes(32);
            
            // Create vote commitment
            const commitment = await zkProofs.createVoteCommitment(
                selectedOption,
                voterSecret
            );

            // Generate eligibility proof
            const eligibilityProof = await zkProofs.generateEligibilityProof(
                account,
                ballot.eligibilityCriteria
            );

            // Generate vote proof
            const voteProof = await zkProofs.generateVoteProof(
                selectedOption,
                commitment
            );

            // Aggregate proofs
            const aggregatedProof = await zkProofs.aggregateProofs([
                eligibilityProof,
                voteProof
            ]);

            // Encrypt vote
            const encryptedVote = await zkProofs.encryptVote(
                selectedOption,
                ballot.publicKey
            );

            // Get contract instance
            const contract = new Contract(votingSystemAbi, process.env.NEXT_PUBLIC_VOTING_SYSTEM_ADDRESS);

            // Cast vote on-chain
            const tx = await contract.cast_vote(
                encryptedVote,
                commitment,
                aggregatedProof
            );

            await tx.wait();

            // Verify vote is in privacy pool
            const merkleRoot = await contract.get_privacy_pool();
            const isVerified = await zkProofs.verifyVoteInPrivacyPool(
                selectedOption,
                aggregatedProof,
                merkleRoot
            );

            if (!isVerified) {
                throw new Error('Vote verification failed');
            }

            // Reset state
            setSelectedOption('');
            loadBallotData();
        } catch (error) {
            setError('Error casting vote: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!ballot) return <div>No ballot found</div>;
    if (!isRegistered) return <div>You are not registered to vote</div>;

    return (
        <div className="voting-interface">
            <h2>{ballot.title}</h2>
            <p>{ballot.description}</p>
            
            <div className="options">
                {ballot.options.map((option, index) => (
                    <div key={index} className="option">
                        <input
                            type="radio"
                            id={`option-${index}`}
                            name="vote"
                            value={option}
                            checked={selectedOption === option}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            disabled={isLoading}
                        />
                        <label htmlFor={`option-${index}`}>{option}</label>
                    </div>
                ))}
            </div>

            <button
                onClick={castVote}
                disabled={!selectedOption || isLoading}
                className="vote-button"
            >
                {isLoading ? 'Casting Vote...' : 'Cast Vote'}
            </button>
        </div>
    );
};

export default VotingInterface;
