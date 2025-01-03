#[starknet::contract]
mod BallotFactory {
    use starknet::{ContractAddress, get_caller_address};
    use starknet::storage_access::StorageAccess;
    use starknet::storage_access::StorageBaseAddress;
    use array::ArrayTrait;
    use option::OptionTrait;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        ballot_count: u256,
        ballots: LegacyMap<u256, BallotInfo>,
    }

    #[derive(Drop, Serde)]
    struct BallotInfo {
        title: felt252,
        description: felt252,
        start_time: u64,
        end_time: u64,
        options: Array<felt252>,
        is_active: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        BallotCreated: BallotCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct BallotCreated {
        ballot_id: u256,
        title: felt252,
        start_time: u64,
        end_time: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.ballot_count.write(0_u256);
    }

    #[external(v0)]
    fn create_ballot(
        ref self: ContractState, 
        title: felt252,
        description: felt252,
        start_time: u64,
        end_time: u64,
        options: Array<felt252>
    ) -> u256 {
        let caller = get_caller_address();
        assert(caller == self.admin.read(), 'Only admin');
        assert(start_time < end_time, 'Invalid time range');
        
        let ballot_id = self.ballot_count.read() + 1_u256;
        
        let ballot = BallotInfo {
            title,
            description,
            start_time,
            end_time,
            options,
            is_active: true,
        };
        
        self.ballots.write(ballot_id, ballot);
        self.ballot_count.write(ballot_id);
        
        self.emit(Event::BallotCreated(BallotCreated { 
            ballot_id,
            title,
            start_time,
            end_time 
        }));
        
        ballot_id
    }

    #[view]
    fn get_ballot(self: @ContractState, ballot_id: u256) -> BallotInfo {
        self.ballots.read(ballot_id)
    }
}
