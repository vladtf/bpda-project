#![no_std]

use election::Election;
#[allow(unused_imports)]
use multiversx_sc::imports::*;
use multiversx_sc::storage;

mod voter;
mod election;

/// An empty contract. To be used as a template when starting a new contract from scratch.
#[multiversx_sc::contract]
pub trait BackendSc {
    #[init]
    fn init(&self) {}

    #[upgrade]
    fn upgrade(&self) {}




    #[view(getElection)]
    #[storage_mapper("elections")]
    fn elections(&self, election_id: u32) -> SingleValueMapper<Election<Self::Api>>;



    #[view(getElectionList)]
    #[storage_mapper("election_list")]
    fn election_list(&self) -> UnorderedSetMapper<ManagedBuffer>;

}
