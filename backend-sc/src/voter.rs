use multiversx_sc::imports::*;
use multiversx_sc::derive_imports::*;



// voters["address"] = { "eligible": True/False, "token": "..." }


#[type_abi]
#[derive(TopEncode, TopDecode, Default, NestedDecode, NestedEncode)]

pub struct Voter<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub eligible: bool,
    pub token: TokenIdentifier<M>,
}
