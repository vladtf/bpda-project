use multiversx_sc::imports::*;
use multiversx_sc::derive_imports::*;

#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, PartialEq, Debug)]
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


pub type ElectionID = u64;
pub type CandidateID = u16;
pub type DisputeID = u16;




#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, Debug)]
pub struct ElectionData<M: ManagedTypeApi> {
    pub id: ElectionID,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub start_time: u64,
    pub end_time: u64,
    pub election_type: ElectionType,
    pub ended: bool,
    pub admin: ManagedAddress<M>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem, Clone, Debug)]
pub struct Vote<M: ManagedTypeApi> {
    pub candidates: ManagedVec<M, CandidateID>,
}


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem, Debug)]
pub struct Candidate<M: ManagedTypeApi> {
    pub id: CandidateID,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub creator: ManagedAddress<M>,
}



#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem, Debug)]
pub struct Dispute<M: ManagedTypeApi> {
    pub id: DisputeID,
    pub name: ManagedBuffer<M>,
    pub description: ManagedBuffer<M>,
    pub creator: ManagedAddress<M>,
    pub resolved: bool,
    pub result_adjusted: bool
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedDecode, NestedEncode, ManagedVecItem, Debug)]
pub struct Voter<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub eligible: bool,
    pub token: TokenIdentifier<M>,
}


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode, ManagedVecItem, Debug)]
pub struct VotingResult {
    pub candidate: CandidateID,
    pub count: u64
}