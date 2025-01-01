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
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, PartialEq)]
pub enum ElectionType {
    #[default]
    Plurality = 0, // single vote, candidate with most votes wins
    Approval = 1, // any number of candidates, candidate with most votes wins
    SingleTransferableVote = 2, // gives ordering of candidates, candidate receive votes from voter if they are the most favoured
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
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem, Clone)]
pub struct Vote<M: ManagedTypeApi> {
    pub candidates: ManagedVec<M, Candidate_ID>,
}


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct Candidate<M: ManagedTypeApi> {
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub creator: ManagedAddress<M>,
}



#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct Dispute<M: ManagedTypeApi> {
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub creator: ManagedAddress<M>,
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


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem)]
pub struct VotingResult {
    pub candidate: Candidate_ID,
    pub count: u64
}