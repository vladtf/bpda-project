use multiversx_sc::imports::*;
use multiversx_sc::derive_imports::*;

// Example structure:
// elections[electionId] = {
//   "name": "...",
//   "description": "...",
//   "start_time": "...",
//   "end_time": "...",
//   "threshold": N,
//   "status": "ongoing" or "ended",
//   "admin": "some_admin_addr"
// }



pub enum ElectionType {
    FirstPastThePost, // single vote, candidate with most votes wins
    Approval, // any number of candidates, candidate with most votes wins
    RankedChoiceVoting, // gives ordering of candidates, candidate receive votes from voter if they are the most favoured
                        // if candidate has least number of votes, they are eliminated and their votes are redistributed
}

#[type_abi]
pub struct Election<M: ManagedTypeApi> {
    pub election_id: ManagedBuffer<M>,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub start_time: u64,
    pub end_time: u64,
    pub ended: bool,
    pub admin: ManagedAddress<M>,
    pub candidates: ManagedBuffer<M>,
    pub disputes: ManagedBuffer<M>,
    pub votes: ManagedBuffer<M>,
}



#[type_abi]

pub struct Candidate<M: ManagedTypeApi> {
    pub candidate_id: ManagedBuffer<M>,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub sign_count: u64,
    pub approved: bool,
    pub votes: u64,
}



#[type_abi]
pub struct Dispute<M : ManagedTypeApi> {
    pub dispute_id : ManagedBuffer<M>,
    pub election_id : ManagedBuffer<M>,
    pub reason: ManagedBuffer<M>,
    pub resolved: bool,
    pub result_adjusted: bool
}