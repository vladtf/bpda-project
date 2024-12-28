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


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode)]
pub enum ElectionType {
    #[default]
    Plurality, // single vote, candidate with most votes wins
    Approval, // any number of candidates, candidate with most votes wins
    SingleTransferableVote, // gives ordering of candidates, candidate receive votes from voter if they are the most favoured
                        // if candidate has least number of votes, they are eliminated and their votes are redistributed
}
impl ElectionType {
    pub fn from_string(s: &str) -> Option<Self> {
        match s {
            "Plurality" => Some(ElectionType::Plurality),
            "Approval" => Some(ElectionType::Approval),
            "SingleTransferableVote" => Some(ElectionType::SingleTransferableVote),
            _ => None,
        }
    }
}


pub type Election_ID = u64;
pub type Candidate_ID = u16;
pub type Dispute_ID = u16;




#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode)]
pub struct ElectionData<M: ManagedTypeApi> {
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub start_time: u64,
    pub end_time: u64,
    pub election_type: ElectionType,
    pub ended: bool,
    pub admin: ManagedAddress<M>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode)]
pub struct Election<M: ManagedTypeApi> {
    pub election_id: Election_ID,
    pub election_data: ElectionData<M>,
    pub candidates: ManagedVec<M, Candidate<M>>,
    pub disputes: ManagedVec<M, Dispute<M>>,
    pub votes: ManagedVec<M, Vote<M>>,
    pub voters: ManagedVec<M, Voter<M>>,
}


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct Vote<M: ManagedTypeApi> {
    pub candidates: ManagedVec<M, Candidate_ID>,
}


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct Candidate<M: ManagedTypeApi> {
    pub candidate_id: Candidate_ID,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub approved: bool,
    pub votes: u64,
}



#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct Dispute<M: ManagedTypeApi> {
    pub dispute_id: Dispute_ID,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub resolved: bool,
    pub result_adjusted: bool
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedDecode, NestedEncode, ManagedVecItem)]

pub struct Voter<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub eligible: bool,
    pub token: TokenIdentifier<M>,
}
