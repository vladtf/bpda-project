#![allow(non_snake_case)]

mod config;
mod proxy;

use config::Config;
use multiversx_sc_snippets::imports::*;
use serde::{Deserialize, Serialize};
use std::{
    io::{Read, Write},
    path::Path,
};

const STATE_FILE: &str = "state.toml";

pub async fn backend_sc_cli() {
    env_logger::init();

    let mut args = std::env::args();
    let _ = args.next();
    let cmd = args.next().expect("at least one argument required");
    let mut interact = ContractInteract::new().await;
    match cmd.as_str() {
        "deploy" => interact.deploy().await,
        "upgrade" => interact.upgrade().await,
        "getCandidateFee" => interact.candidate_fee().await,
        "updateCandidateFee" => interact.update_candidate_fee().await,
        "getElectionIDList" => interact.election_id_list().await,
        "getElectionData" => interact.election_data().await,
        "getRegisteredVoters" => interact.registered_voters().await,
        "getPotentialCandidateIDs" => interact.potential_candidate_id_list().await,
        "getCandidateIDs" => interact.candidate_id_list().await,
        "getCandidate" => interact.candidate().await,
        "getVotes" => interact.votes().await,
        "getDisputeIDList" => interact.dispute_id_list().await,
        "getDispute" => interact.dispute().await,
        "result_vector" => interact.result_vector().await,
        "results" => interact.results().await,
        "electionList" => interact.election_list().await,
        "registerElection" => interact.register_election().await,
        "submitCandidancy" => interact.submit_candidancy().await,
        "registerCandidate" => interact.register_candidate().await,
        "registerSelf" => interact.register_self().await,
        "registerVoter" => interact.register_voter().await,
        "vote" => interact.vote().await,
        "endElection" => interact.end_election().await,
        "makeDispute" => interact.make_dispute().await,
        _ => panic!("unknown command: {}", &cmd),
    }
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct State {
    contract_address: Option<Bech32Address>
}

impl State {
        // Deserializes state from file
        pub fn load_state() -> Self {
            if Path::new(STATE_FILE).exists() {
                let mut file = std::fs::File::open(STATE_FILE).unwrap();
                let mut content = String::new();
                file.read_to_string(&mut content).unwrap();
                toml::from_str(&content).unwrap()
            } else {
                Self::default()
            }
        }
    
        /// Sets the contract address
        pub fn set_address(&mut self, address: Bech32Address) {
            self.contract_address = Some(address);
        }
    
        /// Returns the contract address
        pub fn current_address(&self) -> &Bech32Address {
            self.contract_address
                .as_ref()
                .expect("no known contract, deploy first")
        }
    }
    
    impl Drop for State {
        // Serializes state to file
        fn drop(&mut self) {
            let mut file = std::fs::File::create(STATE_FILE).unwrap();
            file.write_all(toml::to_string(self).unwrap().as_bytes())
                .unwrap();
        }
    }

pub struct ContractInteract {
    interactor: Interactor,
    wallet_address: Address,
    contract_code: BytesValue,
    state: State
}

impl ContractInteract {
    pub async fn new() -> Self {
        let config = Config::new();
        let mut interactor = Interactor::new(config.gateway_uri())
            .await
            .use_chain_simulator(config.use_chain_simulator());

        interactor.set_current_dir_from_workspace("backend_sc");
        let wallet_address = interactor.register_wallet(test_wallets::alice()).await;

        let pem_path = if cfg!(target_family = "windows") {
            Path::new(r"E:\Facultate\master\an1\BPDA\lab\intro\new_wallet.pem")
        } else {
            Path::new(r"/mnt/e/Facultate/master/an1/BPDA/lab/intro/new_wallet.pem")
        };
        let pem = std::fs::read_to_string(pem_path).expect("Failed to read PEM file");
        let wallet = Wallet::from_pem_file_contents(pem).expect("Invalid PEM file");
        let wallet_address = interactor.register_wallet(wallet.clone()).await;

        // Useful in the chain simulator setting
        // generate blocks until ESDTSystemSCAddress is enabled
        interactor.generate_blocks_until_epoch(1).await.unwrap();
        
        let contract_code = BytesValue::interpret_from(
            "mxsc:../output/backend_sc.mxsc.json",
            &InterpreterContext::default(),
        );

        ContractInteract {
            interactor,
            wallet_address,
            contract_code,
            state: State::load_state()
        }
    }

    pub async fn deploy(&mut self) {
        let candidate_fee = BigUint::<StaticApi>::from(0u128);

        let new_address = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .init(candidate_fee)
            .code(&self.contract_code)
            .returns(ReturnsNewAddress)
            .run()
            .await;
        let new_address_bech32 = bech32::encode(&new_address);
        self.state
            .set_address(Bech32Address::from_bech32_string(new_address_bech32.clone()));

        println!("new address: {new_address_bech32}");
    }

    pub async fn upgrade(&mut self) {
        let response = self
            .interactor
            .tx()
            .to(self.state.current_address())
            .from(&self.wallet_address)
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .upgrade()
            .code(&self.contract_code)
            .code_metadata(CodeMetadata::UPGRADEABLE)
            .returns(ReturnsNewAddress)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn candidate_fee(&mut self) {
        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .candidate_fee()
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn update_candidate_fee(&mut self) {
        let candidate_fee = BigUint::<StaticApi>::from(0u128);

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .update_candidate_fee(candidate_fee)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn election_id_list(&mut self) {
        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .election_id_list()
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn election_data(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .election_data(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn registered_voters(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .registered_voters(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn potential_candidate_id_list(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .potential_candidate_id_list(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn candidate_id_list(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .candidate_id_list(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn candidate(&mut self) {
        let election_id = 0u64;
        let candidate_id = 0u16;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .candidate(election_id, candidate_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        let name = result_value.name;
        let description = result_value.description;
        
        
        println!("Name: {}", name);
        println!("Description: {}", description);
        
    }

    pub async fn votes(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .votes(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn dispute_id_list(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .dispute_id_list(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn dispute(&mut self) {
        let election_id = 0u64;
        let dispute_id = 0u16;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .dispute(election_id, dispute_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn result_vector(&mut self) {
        let election_id = 0u64;
        let candidate_id = 0u16;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .result_vector(election_id, candidate_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn results(&mut self) {
        let election_id = 0u64;

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .results(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn election_list(&mut self) {
        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .election_list()
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn register_election(&mut self) {
        let name = ManagedBuffer::new_from_bytes(&b""[..]);
        let description = ManagedBuffer::new_from_bytes(&b""[..]);
        let election_type = 0u64;
        let start_time = 0u64;
        let end_time = 0u64;

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .register_election(name, description, election_type, start_time, end_time)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn submit_candidancy(&mut self) {
        let egld_amount = BigUint::<StaticApi>::from(0u128);

        let election_id = 0u64;
        let name = ManagedBuffer::new_from_bytes(&b""[..]);
        let description = ManagedBuffer::new_from_bytes(&b""[..]);

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .submit_candidancy(election_id, name, description)
            .egld(egld_amount)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn register_candidate(&mut self) {
        let election_id = 0u64;
        let candidate_id = 0u16;

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .register_candidate(election_id, candidate_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn register_self(&mut self) {
        let election_id = 0u64;
        let verification_data = ManagedBuffer::new_from_bytes(&b""[..]);

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .register_self(election_id, verification_data)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn register_voter(&mut self) {
        let election_id = 0u64;
        let voter_address = bech32::decode("");

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .register_voter(election_id, voter_address)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn vote(&mut self) {
        let election_id = 0u64;
        let vote = MultiValueVec::from(vec![0u16]);

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .vote(election_id, vote)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn end_election(&mut self) {
        let election_id = 0u64;

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .end_election(election_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

    pub async fn make_dispute(&mut self) {
        let election_id = 0u64;
        let dispute_name = ManagedBuffer::new_from_bytes(&b""[..]);
        let dispute_description = ManagedBuffer::new_from_bytes(&b""[..]);

        let response = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .to(self.state.current_address())
            .gas(30_000_000u64)
            .typed(proxy::BackendScProxy)
            .make_dispute(election_id, dispute_name, dispute_description)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {response:?}");
    }

}
