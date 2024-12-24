#![no_std]

#[allow(unused_imports)]
use multiversx_sc::imports::*;

mod voter;
mod election;

/// An empty contract. To be used as a template when starting a new contract from scratch.
#[multiversx_sc::contract]
pub trait BackendSc {
    #[init]
    fn init(&self) {}

    #[upgrade]
    fn upgrade(&self) {}
}
