#![no_std]

use types::{Candidate, Candidate_ID, Dispute, Dispute_ID, ElectionData, ElectionType, Election_ID};
#[allow(unused_imports)]
use multiversx_sc::imports::*;
use multiversx_sc::storage;


mod types;

/// An empty contract. To be used as a template when starting a new contract from scratch.
#[multiversx_sc::contract]
pub trait BackendSc {
    #[init]
    fn init(&self) {}

    #[upgrade]
    fn upgrade(&self) {}


    #[view(getElectionIDList)]
    #[storage_mapper("election_id_list")]
    fn election_id_list(&self) -> UnorderedSetMapper<Election_ID>;

    #[view(getElectionData)]
    #[storage_mapper("election_data")]
    fn election_data(&self, election_id: Election_ID) -> SingleValueMapper<ElectionData<Self::Api>>;


    #[view(getRegisteredVoters)]
    #[storage_mapper("registered_voters")]
    fn registered_voters(&self, election_id: Election_ID) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("voterEligible")]
    fn voter_eligible(&self, election_id: Election_ID, voter_address: ManagedAddress) -> SingleValueMapper<bool>;


    #[view(getCandidateIDs)]
    #[storage_mapper("candidate_id_list")]
    fn candidate_id_list(&self, election_id: Election_ID) -> UnorderedSetMapper<Candidate_ID>;

    #[view(getCandidate)]
    #[storage_mapper("candidate")]
    fn candidate(&self, election_id: Election_ID, candidate_id: Candidate_ID) -> SingleValueMapper<Candidate<Self::Api>>;


    #[view(getDisputeIDList)]
    #[storage_mapper("dispute_id_list")]
    fn dispute_id_list(&self, election_id: Election_ID) -> UnorderedSetMapper<Dispute_ID>;

    #[view(getDispute)]
    #[storage_mapper("dispute")]
    fn dispute(&self, election_id: Election_ID, dispute_id: Dispute_ID) -> SingleValueMapper<Dispute<Self::Api>>;


    #[view(results)]
    fn results(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[view(electionList)]
    fn election_list(&self) -> MultiValueEncoded<ElectionData<Self::Api>> {
        let election_ids = self.election_id_list();
        let election_data_iter = election_ids.iter().map(|id| self.election_data(id).get());
        MultiValueEncoded::from_iter(election_data_iter)
    }

    

    fn generate_election_id(&self) -> Election_ID {

        let mut rand_source = RandomnessSource::new();
        loop {
            let election_id = rand_source.next_u64() as Election_ID;
            if !self.election_id_list().contains(&election_id) {
                return election_id;
            }
        }
    }

    fn generate_candidate_id(&self, election_id: Election_ID) -> Candidate_ID {
        let mut rand_source = RandomnessSource::new();
        loop {
            let candidate_id = rand_source.next_u64() as Candidate_ID;
            if !self.candidate_id_list(election_id).contains(&candidate_id) {
                return candidate_id;
            }
        }
    }

    fn generate_dispute_id(&self, election_id: Election_ID) -> Dispute_ID {
        let mut rand_source = RandomnessSource::new();
        loop {
            let dispute_id = rand_source.next_u64() as Dispute_ID;
            if !self.dispute_id_list(election_id).contains(&dispute_id) {
                return dispute_id;
            }
        }
    }


    #[endpoint(registerElection)]
    fn register_election(&self, name: ManagedBuffer, description: ManagedBuffer, election_type: ManagedBuffer, start_time: u64, end_time: u64) -> ManagedBuffer {

        let election_id = self.generate_election_id();
        let mut arr: ArrayVec<u8, 32> = ArrayVec::new();
        let d = election_type.to_boxed_bytes();
        let election_t = match election_type.load_to_byte_array(arr.as_mut_slice()) {
            ManagedBuffer::from(b"Plurality") => ElectionType::Plurality,
            ManagedBuffer::from(b"Approval") => ElectionType::Approval,
            ManagedBuffer::from(b"SingleTransferableVote") => ElectionType::SingleTransferableVote,
            _ => panic!("Invalid election type"),
        };
        // let election_t = ElectionType::from_string(election_type);
        let election_data = ElectionData {
            name: name,
            description: description,

            start_time,
            end_time,
            ended: false,
            election_type: ElectionType::Plurality,
            admin: self.blockchain().get_caller(),
        };
        self.election_id_list().insert(election_id);
        self.election_data(election_id).set(&election_data);

        return self.blockchain().get_caller();
    }

    #[endpoint(eligibilityCheck)]
    fn eligibility_check(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(registerCandidate)]
    fn register_candidate(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(signCandidate)]
    fn sign_candidate(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(vote)]
    fn vote(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(endElection)]
    fn end_election(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(makeDispute)]
    fn make_dispute(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(resolveDispute)]
    fn resolve_dispute(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }

    #[endpoint(validateCandidate)]
    fn validate_candidate(&self) -> ManagedAddress {
        return self.blockchain().get_caller();
    }


}
