#![no_std]

use types::{Candidate, Candidate_ID, Dispute, Dispute_ID, ElectionData, ElectionType, Election_ID, Vote, VotingResult};
#[allow(unused_imports)]
use multiversx_sc::imports::*;
use multiversx_sc::storage;


mod types;
const MAX_NAME_LENGTH: usize = 50;

const MAX_DESCRIPTION_LENGTH: usize = 200;
/// An empty contract. To be used as a template when starting a new contract from scratch.
#[multiversx_sc::contract]
pub trait BackendSc {
    #[init]
    fn init(&self) {}

    #[upgrade]
    fn upgrade(&self) {}


    // Storage mappers


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

    #[view(getVotes)]
    #[storage_mapper("votes")]
    fn votes(&self, election_id: Election_ID) -> UnorderedSetMapper<Vote<Self::Api>>;

    #[view(getDisputeIDList)]
    #[storage_mapper("dispute_id_list")]
    fn dispute_id_list(&self, election_id: Election_ID) -> UnorderedSetMapper<Dispute_ID>;

    #[view(getDispute)]
    #[storage_mapper("dispute")]
    fn dispute(&self, election_id: Election_ID, dispute_id: Dispute_ID) -> SingleValueMapper<Dispute<Self::Api>>;


    fn count_candidate(&self, vote_counts: &mut ManagedVec<VotingResult>, candidate_id: Candidate_ID) {

        for i in 0..vote_counts.len() {
            // Add one to the count if the candidate is already in the list
            let mut vote_result = vote_counts.get_mut(i);
            
            if vote_result.candidate == candidate_id {
                vote_result.count += 1;
                return;
            }
        }
        // If the candidate is not in the list, add it
        vote_counts.push(VotingResult { candidate: candidate_id, count: 1 });
        
    }


    fn evaluate_plurality_or_approval(&self, election_id: Election_ID) -> ManagedVec<VotingResult> {
        
        let mut vote_counts: ManagedVec<VotingResult> = ManagedVec::new();

        // Count each vote
        for vote in self.votes(election_id).iter() {

            // For each candidate in the vote (Plurality has only one candidate)
            for c in vote.candidates.iter() {
                self.count_candidate(&mut vote_counts, c);
            }
        }
        return vote_counts;
    }

    fn evaluate_single_transferable_vote(&self, election_id: Election_ID) -> ManagedVec<VotingResult> {
        let mut votes_copy : ManagedVec<Vote<Self::Api>> = self.votes(election_id)
                                                            .iter()
                                                            .map(|vote| vote.clone())
                                                            .collect();



        // Count initial votes
        let mut vote_counts: ManagedVec<VotingResult> = ManagedVec::new();

        for vote in self.votes(election_id).iter() {

            // Only the first candidate is counted
            let first_candidate: u16 = vote.candidates.get(0);
            self.count_candidate(&mut vote_counts, first_candidate);
        
        }

        // keep removing the worst performing candidate until you obtain majority
        loop {

            let mut worst : Candidate_ID = 0;
            let mut min_vote = u64::MAX;

            for result in vote_counts.iter() {

                // check if there is a winner(has more than 50% votes)
                if result.count as usize > votes_copy.len() / 2 {
                    return vote_counts;
                }

                // find worst performing candidate
                if result.count < min_vote {
                    min_vote = result.count;
                    worst = result.candidate;
                }
            }


            // redistribute votes

            // for each vote
            for i in 0..votes_copy.len() {
                let mut vote = votes_copy.get_mut(i);
                
                // if the first candidate is the worst
                // remove the first candidate and add the vote to the next first candidate
                if vote.candidates.get(0) == worst {
                    // remove the first candidate
                    vote.candidates.remove(0);

                    // find the next first candidate
                    let next_c = vote.candidates.get(0);

                    // add the vote to the next first candidate
                    self.count_candidate(&mut vote_counts, next_c);
                }
                // remove the worst candidate if it has remained otherwise
                if let Some(index) = vote.candidates.iter().position(|c| c == worst) {
                    vote.candidates.remove(index);
                }
            }
        }
    }


    #[view(results)]
    fn results(&self, election_id: Election_ID) -> Candidate_ID {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().end_time > self.blockchain().get_block_timestamp(), "Election has not ended yet");



        let vote_counts = match self.election_data(election_id).get().election_type {
            ElectionType::Plurality => self.evaluate_plurality_or_approval(election_id),
            ElectionType::Approval => self.evaluate_plurality_or_approval(election_id),
            ElectionType::SingleTransferableVote => self.evaluate_single_transferable_vote(election_id),
        };

        // find the candidate with the most votes

        let mut max_votes = 0;
        let mut winning_candidate = 0;
        for result in vote_counts.iter() {
            if result.count > max_votes {
                max_votes = result.count;
                winning_candidate = result.candidate;
            }
        }

        return winning_candidate

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
    fn register_election(&self, name: ManagedBuffer, description: ManagedBuffer, election_type: u64, start_time: u64, end_time: u64) -> Election_ID {

        let election_id = self.generate_election_id();
        require!(name.len() > 0, "Name cannot be empty");
        require!(name.len() <= 50, "Name cannot be longer than 50 characters");
        require!(description.len() > 0, "Description cannot be empty");
        require!(description.len() <= 200, "Description cannot be longer than 200 characters");
        require!(election_type < 3, "Invalid election type");
        let election_type: ElectionType = match election_type {
            0 => ElectionType::Plurality,
            1 => ElectionType::Approval,
            2 => ElectionType::SingleTransferableVote,
            _ => ElectionType::Plurality
        };
        let election_data = ElectionData {
            name,
            description,
            election_type: election_type,
            start_time,
            end_time,
            ended: false,
            admin: self.blockchain().get_caller(),
        };
        self.election_id_list().insert(election_id);
        self.election_data(election_id).set(&election_data);

        return election_id;
    }

    

    #[endpoint(registerCandidate)]
    fn register_candidate(&self, election_id: Election_ID, name: ManagedBuffer, description: ManagedBuffer) -> Candidate_ID {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");
        require!(self.blockchain().get_caller() == self.election_data(election_id).get().admin, "Only admin can register candidates");
        require!(self.election_data(election_id).get().start_time < self.blockchain().get_block_timestamp(), "Election has started");

        require!(name.len() > 0, "Name cannot be empty");
        require!(name.len() <= 50, "Name cannot be longer than 50 characters");
        require!(description.len() > 0, "Description cannot be empty");
        require!(description.len() <= 50, "Description cannot be longer than 200 characters");

        let candidate_id = self.generate_candidate_id(election_id);
        let candidate = Candidate {
            name,
            description,
        };
        self.candidate_id_list(election_id).insert(candidate_id);
        self.candidate(election_id, candidate_id).set(&candidate);
        return candidate_id;


    }


    #[endpoint(registerVoter)]
    fn register_voter(&self, election_id: Election_ID, voter_address: ManagedAddress) {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.blockchain().get_caller() == self.election_data(election_id).get().admin, "Only admin can register voters");
        require!(!self.registered_voters(election_id).contains(&voter_address), "Voter already registered");
        self.registered_voters(election_id).insert(voter_address.clone());
        self.voter_eligible(election_id, voter_address).set(&true);
    }

    

    #[endpoint(vote)]
    fn vote(&self, election_id: Election_ID, vote: MultiValueEncoded<Candidate_ID>) {

        let voter_address = self.blockchain().get_caller();

        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");
        require!(self.registered_voters(election_id).contains(&voter_address), "You are not registered as a voter");
        require!(self.voter_eligible(election_id, voter_address).get(), "You are not eligible to vote");
        
        if self.election_data(election_id).get().election_type == ElectionType::Plurality {
            require!(vote.len() == 1, "Plurality election can only have one candidate");
        }

        for c_id in vote.clone() {
            require!(self.candidate_id_list(election_id).contains(&c_id), "Invalid candidate");

        }
        let x = Vote {candidates: vote.to_vec()};
        self.votes(election_id).insert(x);
    }

    #[endpoint(endElection)]
    fn end_election(&self, election_id: Election_ID) {
        require!(self.blockchain().get_caller() == self.blockchain().get_caller(), "Only admin can end election");
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");

        self.election_data(election_id).update(|election_data| {
            election_data.ended = true;
        });
    }

    #[endpoint(makeDispute)]
    fn make_dispute(&self, election_id: Election_ID, dispute_name: ManagedBuffer, dispute_description: ManagedBuffer) -> Dispute_ID {

        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(dispute_name.len() > 0, "Name cannot be empty");
        require!(dispute_name.len() <= 50, "Name cannot be longer than 50 characters");
        require!(dispute_description.len() > 0, "Description cannot be empty");
        require!(dispute_description.len() <= 200, "Description cannot be longer than 200 characters");
        let dispute = Dispute {
            name: dispute_name,
            description: dispute_description,
            creator: self.blockchain().get_caller(),
            resolved: false,
            result_adjusted: false
        };
        let dispute_id = self.generate_dispute_id(election_id);
        self.dispute_id_list(election_id).insert(dispute_id);
        self.dispute(election_id, dispute_id).set(&dispute);
        return dispute_id;
    }

    // #[endpoint(signCandidate)]
    // fn sign_candidate(&self) -> ManagedAddress {
    //     return self.blockchain().get_caller();
    // }

    // #[endpoint(resolveDispute)]
    // fn resolve_dispute(&self) -> ManagedAddress {
    //     return self.blockchain().get_caller();
    // }

    // #[endpoint(validateCandidate)]
    // fn validate_candidate(&self) -> ManagedAddress {
    //     return self.blockchain().get_caller();
    // }

    // #[endpoint(eligibilityCheck)]
    // fn eligibility_check(&self) -> ManagedAddress {
    //     return self.blockchain().get_caller();
    // }


}
