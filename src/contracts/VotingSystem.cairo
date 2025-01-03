#[starknet::contract]
mod VotingSystem {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage_access::StorageAccess;
    use starknet::storage_access::StorageBaseAddress;
    use array::ArrayTrait;
    use option::OptionTrait;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        voters: LegacyMap<ContractAddress, bool>,
        encrypted_votes: LegacyMap<ContractAddress, felt252>,
        vote_commitments: LegacyMap<ContractAddress, felt252>,
        voter_proofs: LegacyMap<ContractAddress, felt252>,
        is_active: bool,
        calimero_network_id: felt252,
        privacy_pool: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VoteCast: VoteCast,
        VoteCommitment: VoteCommitment,
        PrivacyPoolUpdate: PrivacyPoolUpdate,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCast {
        voter: ContractAddress,
        encrypted_vote: felt252,
        commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCommitment {
        voter: ContractAddress,
        commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PrivacyPoolUpdate {
        pool_id: felt252,
        merkle_root: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, 
        admin: ContractAddress, 
        calimero_network_id: felt252,
        privacy_pool: felt252
    ) {
        self.admin.write(admin);
        self.is_active.write(true);
        self.calimero_network_id.write(calimero_network_id);
        self.privacy_pool.write(privacy_pool);
    }

    #[external(v0)]
    fn cast_vote(
        ref self: ContractState, 
        encrypted_vote: felt252, 
        vote_commitment: felt252,
        zk_proof: felt252
    ) {
        // Verify voting is active
        assert(self.is_active.read(), 'Voting is not active');
        
        // Get caller address
        let caller = get_caller_address();
        
        // Verify voter hasn't voted before
        assert(!self.voters.read(caller), 'Already voted');
        
        // Verify the ZK proof using Calimero's privacy pool
        assert(
            self._verify_calimero_proof(caller, zk_proof),
            'Invalid vote proof'
        );
        
        // Store encrypted vote and commitment
        self.encrypted_votes.write(caller, encrypted_vote);
        self.vote_commitments.write(caller, vote_commitment);
        self.voter_proofs.write(caller, zk_proof);
        self.voters.write(caller, true);

        // Emit events
        self.emit(Event::VoteCast(VoteCast {
            voter: caller,
            encrypted_vote: encrypted_vote,
            commitment: vote_commitment,
        }));

        self.emit(Event::VoteCommitment(VoteCommitment {
            voter: caller,
            commitment: vote_commitment,
        }));
    }

    #[external(v0)]
    fn update_privacy_pool(ref self: ContractState, new_merkle_root: felt252) {
        // Only admin can update privacy pool
        assert(get_caller_address() == self.admin.read(), 'Not admin');
        
        // Update privacy pool merkle root
        self.privacy_pool.write(new_merkle_root);

        // Emit event
        self.emit(Event::PrivacyPoolUpdate(PrivacyPoolUpdate {
            pool_id: self.calimero_network_id.read(),
            merkle_root: new_merkle_root,
        }));
    }

    #[view]
    fn get_vote_commitment(self: @ContractState, voter: ContractAddress) -> felt252 {
        self.vote_commitments.read(voter)
    }

    #[view]
    fn get_encrypted_vote(self: @ContractState, voter: ContractAddress) -> felt252 {
        self.encrypted_votes.read(voter)
    }

    #[view]
    fn get_privacy_pool(self: @ContractState) -> felt252 {
        self.privacy_pool.read()
    }

    #[internal]
    fn _verify_calimero_proof(self: @ContractState, voter: ContractAddress, proof: felt252) -> bool {
        // This would integrate with Calimero's privacy pool verification
        // For now, we'll do a basic check
        let pool_root = self.privacy_pool.read();
        let network_id = self.calimero_network_id.read();
        
        // TODO: Implement actual Calimero proof verification
        // This is a placeholder that should be replaced with actual verification
        proof != 0_felt252
    }
}
