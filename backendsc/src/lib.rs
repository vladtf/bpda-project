#![no_std]

use types::{Candidate, CandidateID, Dispute, DisputeID, ElectionData, ElectionType, ElectionID, Vote, VotingResult};
#[allow(unused_imports)]
use multiversx_sc::imports::*;

mod types;

/// An empty contract. To be used as a template when starting a new contract from scratch.
#[multiversx_sc::contract]
pub trait BackendSc {
    #[init]
    fn init(&self, candidate_fee: BigUint) {
        self.candidate_fee().set(&candidate_fee);
    }

    #[upgrade]
    fn upgrade(&self) {}


    // Storage mappers

    #[view(getCandidateFee)]
    #[storage_mapper("candidate_fee")]
    fn candidate_fee(&self) -> SingleValueMapper<BigUint>;

    #[endpoint(updateCandidateFee)]
    fn update_candidate_fee(&self, candidate_fee: BigUint) {
        self.candidate_fee().set(&candidate_fee);
    }




    #[view(getElectionIDList)]
    #[storage_mapper("election_id_list")]
    // the list of election ids
    fn election_id_list(&self) -> UnorderedSetMapper<ElectionID>;

    #[view(getElectionData)]
    #[storage_mapper("election_data")]
    // the election data for each election
    fn election_data(&self, election_id: ElectionID) -> SingleValueMapper<ElectionData<Self::Api>>;


    #[view(getRegisteredVoters)]
    #[storage_mapper("registered_voters")]
    // the list of registered voters for each election
    fn registered_voters(&self, election_id: ElectionID) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("voterEligible")]
    // whether a voter is eligible to vote (true if hasn't voted yet, false otherwise)
    fn voter_eligible(&self, election_id: ElectionID, voter_address: ManagedAddress) -> SingleValueMapper<bool>;


    #[view(getPotentialCandidateIDs)]
    #[storage_mapper("potential_candidate_id_list")]
    // the list of candidate ids that have applied for an election
    fn potential_candidate_id_list(&self, election_id: ElectionID) -> UnorderedSetMapper<CandidateID>;

    #[view(getCandidateIDs)]
    #[storage_mapper("candidate_id_list")]
    // the list of candidate ids that are eligible for an election
    fn candidate_id_list(&self, election_id: ElectionID) -> UnorderedSetMapper<CandidateID>;

    #[view(getCandidate)]
    #[storage_mapper("candidate")]
    // the candidate data for each candidate in an election
    fn candidate(&self, election_id: ElectionID, candidate_id: CandidateID) -> SingleValueMapper<Candidate<Self::Api>>;


    #[view(getVotes)]
    #[storage_mapper("votes")]
    // the list of votes for each election
    fn votes(&self, election_id: ElectionID) -> UnorderedSetMapper<Vote<Self::Api>>;

    #[view(getDisputeIDList)]
    #[storage_mapper("dispute_id_list")]
    // the list of dispute ids
    fn dispute_id_list(&self, election_id: ElectionID) -> UnorderedSetMapper<DisputeID>;

    #[view(getDispute)]
    #[storage_mapper("dispute")]
    // the dispute data for each dispute
    fn dispute(&self, election_id: ElectionID, dispute_id: DisputeID) -> SingleValueMapper<Dispute<Self::Api>>;



    #[event("ElectionCreated")]
    fn election_created(&self, election_id: ElectionID);

/// Updates the vote count for a given candidate in the election.
/// 
/// If the candidate is already present in the `vote_counts` list, this function increments
/// their vote count by one. If the candidate is not present, it adds a new entry for the
/// candidate with an initial vote count of one.
///
/// # Arguments
///
/// * `vote_counts` - A mutable reference to a `ManagedVec` of `VotingResult` which holds
///   the current vote counts for each candidate.
/// * `candidate_id` - The identifier of the candidate for whom the vote count should be updated.

    fn count_candidate(&self, vote_counts: &mut ManagedVec<VotingResult>, candidate_id: CandidateID) {

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


    /// Evaluates the results of a Plurality or Approval election.
    /// 
    /// # Arguments
    ///
    /// * `election_id` - The identifier of the election whose results should be evaluated.
    ///
    /// # Returns
    ///
    /// A `ManagedVec` of `VotingResult` which holds the final vote counts for each candidate.
    fn evaluate_plurality_or_approval(&self, election_id: ElectionID) -> ManagedVec<VotingResult> {
        
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

    /// Evaluates the results of a Single Transferable Vote election.
    /// 
    /// The Single Transferable Vote (STV) system is a proportional representation voting system
    /// designed to achieve proportional representation through the use of multiple seats and vote transfer.
    /// 
    /// The algorithm works as follows:
    /// 1. Count the initial votes for each candidate.
    /// 2. Remove the worst performing candidate and redistribute its votes to the next preferred candidate.
    /// 3. Repeat step 2 until a candidate has more than 50% of the votes.
    /// 
    /// The function returns a `ManagedVec` of `VotingResult` which holds the final vote counts for each candidate.
    fn evaluate_single_transferable_vote(&self, election_id: ElectionID) -> ManagedVec<VotingResult> {
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

            let mut worst : CandidateID = 0;
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




    #[view(result_vector)]
    #[storage_mapper("result_vector")]
    fn result_vector(&self, election_id: ElectionID, candidate_id: CandidateID) -> SingleValueMapper<u64>;

    #[storage_mapper("finished_election")]
    fn finished_election(&self, election_id: ElectionID) -> SingleValueMapper<bool>;

    /// Determines the winning candidate of an election based on its type.
    ///
    /// This function verifies that the specified election has ended and then evaluates
    /// the votes according to the election type. It supports Plurality, Approval, and 
    /// Single Transferable Vote election types. The function returns the candidate ID 
    /// with the highest number of votes.
    ///
    /// # Arguments
    ///
    /// * `election_id` - The identifier of the election whose results should be computed.
    ///
    /// # Returns
    ///
    /// The candidate ID of the winning candidate.
    ///
    /// # Panics
    ///
    /// Panics if the election does not exist or has not ended yet.
    #[view(results)]
    fn results(&self, election_id: ElectionID) -> CandidateID {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().end_time > self.blockchain().get_block_timestamp(), "Election has not ended yet");

        if !self.finished_election(election_id).get() {
            let vote_counts = match self.election_data(election_id).get().election_type {
                ElectionType::Plurality => self.evaluate_plurality_or_approval(election_id),
                ElectionType::Approval => self.evaluate_plurality_or_approval(election_id),
                ElectionType::SingleTransferableVote => self.evaluate_single_transferable_vote(election_id),
            };


            for result in vote_counts.iter() {
                self.result_vector(election_id, result.candidate).set(&result.count);
            }
            self.finished_election(election_id).set(&true);
        }

        let vote_counts : ManagedVec<VotingResult> = self.candidate_id_list(election_id).iter().map(|c_id| VotingResult {candidate: c_id, count: self.result_vector(election_id, c_id).get()}).collect();

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

    

    /// Generates a unique election ID.

    /// This function generates a random election ID and ensures that it is not already in use.
    fn generate_election_id(&self) -> ElectionID {

        let mut rand_source = RandomnessSource::new();
        loop {
            let election_id = rand_source.next_u64() as ElectionID;
            if !self.election_id_list().contains(&election_id) {
                return election_id;
            }
        }
    }

    /// Generates a unique candidate ID for the given election.

    /// This function generates a random candidate ID and ensures that it is not already in use
    /// by either the list of candidates or the list of potential candidates for the given election.
    fn generate_candidate_id(&self, election_id: ElectionID) -> CandidateID {

        let mut rand_source = RandomnessSource::new();
        loop {
            let candidate_id = rand_source.next_u64() as CandidateID;
            if !self.candidate_id_list(election_id).contains(&candidate_id) && !self.potential_candidate_id_list(election_id).contains(&candidate_id) {
                return candidate_id;
            }
        }
    }

    /// Generates a unique dispute ID for the given election.
    ///
    /// This function generates a random dispute ID and ensures that it is not already in use by
    /// the list of disputes for the given election.
    fn generate_dispute_id(&self, election_id: ElectionID) -> DisputeID {

        let mut rand_source = RandomnessSource::new();
        loop {
            let dispute_id = rand_source.next_u64() as DisputeID;
            if !self.dispute_id_list(election_id).contains(&dispute_id) {
                return dispute_id;
            }
        }
    }


    


    #[endpoint(registerElection)]
    fn register_election(&self, name: ManagedBuffer, description: ManagedBuffer, election_type: u64, start_time: u64, end_time: u64) -> ElectionID {

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


    #[endpoint(submitCandidancy)]
    #[payable("EGLD")]
    fn submit_candidancy(&self, election_id: ElectionID, name: ManagedBuffer, description: ManagedBuffer) -> CandidateID {
    
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");
        require!(self.election_data(election_id).get().start_time > self.blockchain().get_block_timestamp(), "Election has started");


        // manage fee
        let payment_amount = self.call_value().egld_value().clone_value();
        let candidate_fee = self.candidate_fee().get();
        require!(payment_amount >= candidate_fee, "Not enough EGLD");

        self.send().direct_egld(&self.election_data(election_id).get().admin, &self.candidate_fee().get());


        require!(name.len() > 0, "Name cannot be empty");
        require!(name.len() <= 50, "Name cannot be longer than 50 characters");
        require!(description.len() > 0, "Description cannot be empty");
        require!(description.len() <= 50, "Description cannot be longer than 200 characters");

        let candidate_id = self.generate_candidate_id(election_id);
        let candidate = Candidate {
            name,
            description,
            creator: self.blockchain().get_caller(),
        };
        self.potential_candidate_id_list(election_id).insert(candidate_id);
        self.candidate(election_id, candidate_id).set(&candidate);
        return candidate_id;
    }

    #[endpoint(registerCandidate)]
    fn register_candidate(&self, election_id: ElectionID, candidate_id: CandidateID) -> CandidateID {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");
        require!(self.blockchain().get_caller() == self.election_data(election_id).get().admin, "Only admin can register candidates");
        require!(self.election_data(election_id).get().start_time > self.blockchain().get_block_timestamp(), "Election has started");


        require!(self.potential_candidate_id_list(election_id).contains(&candidate_id), "Candidate does not exist");
        require!(!self.candidate_id_list(election_id).contains(&candidate_id), "Candidate already registered");
        self.candidate_id_list(election_id).insert(candidate_id);
        self.potential_candidate_id_list(election_id).swap_remove(&candidate_id);
        return candidate_id;

    }

    /// This function implements the verification logic to validate the eligibility of a voter.
    ///
    /// In this example, the verification logic is a simple check that the verification data is at least 8 bytes long.
    /// In a real-world scenario, this function would be replaced with a more complex verification logic that
    /// checks the provided verification data against a trusted source, such as a government database or a
    /// decentralized identity (DID) system.
    fn verification_logic(&self, _election_id: ElectionID, verification_data: ManagedBuffer) -> bool{
        return verification_data.len() > 8;
    }

    #[endpoint(registerSelf)]
    fn register_self(&self, election_id: ElectionID, verification_data: ManagedBuffer) {

        let voter_address = self.blockchain().get_caller();

        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");
        require!(self.election_data(election_id).get().start_time > self.blockchain().get_block_timestamp(), "Election has started");
        require!(!self.registered_voters(election_id).contains(&voter_address), "Already registered");

        // perform verification logic here
        require!(self.verification_logic(election_id, verification_data), "Invalid verification data");

        // register the voter
        self.registered_voters(election_id).insert(self.blockchain().get_caller());
        self.voter_eligible(election_id, voter_address).set(&true);
    }

    #[endpoint(registerVoter)]
    fn register_voter(&self, election_id: ElectionID, voter_address: ManagedAddress) {
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.blockchain().get_caller() == self.election_data(election_id).get().admin, "Only admin can register voters");
        require!(!self.registered_voters(election_id).contains(&voter_address), "Voter already registered");


        self.registered_voters(election_id).insert(voter_address.clone());
        self.voter_eligible(election_id, voter_address).set(&true);


    }

    

    #[endpoint(vote)]
    fn vote(&self, election_id: ElectionID, vote: MultiValueEncoded<CandidateID>) {

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
        self.voter_eligible(election_id, self.blockchain().get_caller()).set(&false);
    }

    #[endpoint(endElection)]
    fn end_election(&self, election_id: ElectionID) {
        require!(self.blockchain().get_caller() == self.blockchain().get_caller(), "Only admin can end election");
        require!(self.election_id_list().contains(&election_id), "Election does not exist");
        require!(self.election_data(election_id).get().ended == false, "Election has already ended");

        self.election_data(election_id).update(|election_data| {
            election_data.ended = true;
        });
    }

    #[endpoint(makeDispute)]
    fn make_dispute(&self, election_id: ElectionID, dispute_name: ManagedBuffer, dispute_description: ManagedBuffer) -> DisputeID {

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

    // #[endpoint(resolveDispute)]
    // fn resolve_dispute(&self) -> ManagedAddress {
    //     return self.blockchain().get_caller();
    // }


    #[view(getCurrentBlockTimestamp)]
    fn get_block_timestamp(&self) -> u64 {
        self.blockchain().get_block_timestamp()
    }

}
