#![allow(non_snake_case)]

mod config;
mod proxy;

use config::Config;
use multiversx_sc_snippets::imports::*;
use serde::{Deserialize, Serialize};
use std::{
    io::{self, Read, Write}, path::Path
};
use chrono::{DateTime, Utc};
use num_bigint;
const STATE_FILE: &str = "state.toml";

pub async fn backendsc_cli() {
    env_logger::init();

    let mut input = String::new();

    let mut interact = ContractInteract::new().await;
    loop {
        print!("> ");
        io::stdout().flush().unwrap();
        input.clear();
        
        io::stdin().read_line(&mut input).unwrap();
        
        if input.trim().is_empty() {
            break;
        }
        let mut args = input.trim().split_whitespace();
        let cmd = args.next().expect("at least one argument required");

        match cmd {
            "deploy" => call_deploy(&mut interact, &mut args).await,
            "upgrade" => call_upgrade(&mut interact, &mut args).await,
            "getCandidateFee" => interact.candidate_fee().await,
            "updateCandidateFee" => call_update_candidate_fee(&mut interact, &mut args).await,
            "getElectionIDList" => interact.election_id_list().await,
            "getElectionData" => call_get_election_data(&mut interact, args).await,
            "getRegisteredVoters" => call_get_registered_voters(&mut interact, args).await,
            "getPotentialCandidateIDs" => call_get_potential_candidate_id_list(&mut interact, args).await,
            "getCandidateIDs" => call_get_candidate_id_list(&mut interact, args).await,
            "getCandidate" => call_get_candidate(&mut interact, args).await,
            "getVotes" => call_get_votes(&mut interact, args).await,
            "getDisputeIDList" => call_get_dispute_id_list(&mut interact, args).await,
            "getDispute" => call_get_dispute(&mut interact, args).await,
            "result_vector" => call_result_vector(&mut interact, args).await,
            "results" => call_results(&mut interact, args).await,
            "electionList" => interact.election_list().await,
            "registerElection" => call_register_election(&mut interact, args).await,
            "submitCandidancy" => call_submit_candidancy(&mut interact, args).await,
            "registerCandidate" => call_register_candidate(&mut interact, args).await,
            "registerSelf" => call_register_self(&mut interact, args).await,
            "registerVoter" => call_register_voter(&mut interact, args).await,
            "vote" => call_vote(&mut interact, args).await,
            "endElection" => call_end_election(&mut interact, args).await,
            "makeDispute" => call_make_dispute(&mut interact, args).await,
            "exit" => break,
            _ => println!("unknown command {}", cmd),
        }

    }
}


fn get_biguint(args: &mut std::str::SplitWhitespace<'_>) -> Result<BigUint<StaticApi>, &'static str> {
    let value = get_value::<num_bigint::BigUint>(args)?;
    Ok(BigUint::<StaticApi>::from(value))
}

fn get_value<T: std::str::FromStr>(args: &mut std::str::SplitWhitespace<'_>) -> Result<T, &'static str> {
    let value = args.next().ok_or("value required")?;
    value.parse::<T>().map_err(|_| "invalid value")
}


async fn call_deploy(interact: &mut ContractInteract, args: &mut std::str::SplitWhitespace<'_>) {
    let candidate_fee = match get_biguint(args) {
        Ok(candidate_fee) => candidate_fee,
        Err(e) => {
            println!("Error parsing candidate fee: {}", e);
            return ;
        }
    };
    interact.deploy(candidate_fee).await;
}

async fn call_upgrade(interact: &mut ContractInteract, _: &mut std::str::SplitWhitespace<'_>) {
    interact.upgrade().await;
}

async fn call_update_candidate_fee(interact: &mut ContractInteract, args: &mut  std::str::SplitWhitespace<'_>) {
    let candidate_fee = match get_biguint(args) {
        Ok(candidate_fee) => candidate_fee,
        Err(e) => {
            println!("Error parsing candidate fee: {}", e);
            return ;
        }
    };
    interact.update_candidate_fee(candidate_fee).await;
}

async fn call_on_election_id<F, T>( args: &mut  std::str::SplitWhitespace<'_>, on_election_id: F ) 
where F: FnOnce(u64, &mut std::str::SplitWhitespace<'_>) -> T, 
      T: std::future::Future<Output=()>
{
    let election_id = match get_value::<u64>(args) {
        Ok(election_id) => election_id,
        Err(e) => {println!("Error parsing election id: {}", e); return;}
    };
    on_election_id(election_id, args).await;
}


async fn call_on_election_id_and_candidate_id<F, T>( args: &mut  std::str::SplitWhitespace<'_>, on_election_id_and_candidate_id: F ) 
where F: FnOnce(u64, u16, &mut std::str::SplitWhitespace<'_>) -> T, 
      T: std::future::Future<Output=()>
{
    let election_id = match get_value::<u64>(args) {
        Ok(election_id) => election_id,
        Err(e) => {println!("Error parsing election id: {}", e); return;}
    };
    let candidate_id = match get_value::<u16>(args) {
        Ok(candidate_id) => candidate_id,
        Err(e) => {println!("Error parsing candidate id: {}", e); return;}
    };
    on_election_id_and_candidate_id(election_id, candidate_id, args).await;
}

async fn call_get_election_data(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.election_data(election_id)).await;
}

async fn call_get_registered_voters(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.registered_voters(election_id)).await;
}

async fn call_get_potential_candidate_id_list(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.potential_candidate_id_list(election_id)).await;
}

async fn call_get_candidate_id_list(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.candidate_id_list(election_id)).await;
}

async fn call_get_candidate(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id_and_candidate_id(&mut args, 
        |election_id, candidate_id, _| 
        interact.candidate(election_id, candidate_id)
    ).await;
}

async fn call_get_votes(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.votes(election_id)).await;
}

async fn call_get_dispute_id_list(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.dispute_id_list(election_id)).await;
}

async fn call_get_dispute(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    let election_id = match get_value::<u64>(args) {
        Ok(election_id) => election_id,
        Err(e) => {println!("Error parsing election id: {}", e); return;}
    };
    let dispute_id = match get_value::<u16>(args) {
        Ok(dispute_id) => dispute_id,
        Err(e) => {println!("Error parsing dispute id: {}", e); return;}
    };
    interact.dispute(election_id, dispute_id).await;
}

async fn call_result_vector(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id_and_candidate_id(&mut args, 
        |election_id, candidate_id, _| 
        interact.result_vector(election_id, candidate_id)
    ).await;
}

async fn call_results(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.results(election_id)).await;
}

async fn call_register_election(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    let name = match args.next() {
        Some(name) => name,
        None => {println!("name required"); return;}
    };
    let description = match args.next() {
        Some(description) => description,
        None => {println!("description required"); return;}
    };
    let election_type = match get_value(args) {
        Ok(election_type) => election_type,
        Err(e) => {println!("Error parsing election type: {}", e); return;}
    };
    let start_time = args.next().expect("start time required; format: YYYY-MM-DD HH:MM:SS");
    let start_time = 
    let start_time: u64 = start_time.parse().expect("invalid start time");
    let end_time = args.next().expect("end time required");
    let end_time: u64 = end_time.parse().expect("invalid end time");
    interact.register_election(name, description, election_type, start_time, end_time).await;
}

async fn call_submit_candidancy(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    let election_id = args.next().expect("election id required");
    let election_id: u64 = election_id.parse().expect("invalid election id");
    let name = args.next().expect("name required");
    let description = args.next().expect("description required");
    let candidate_fee = match get_biguint(&mut args) {
        Ok(candidate_fee) => candidate_fee,
        Err(e) => {
            println!("Error parsing candidate fee: {}", e);
            return ;
        }
    };
    
    interact.submit_candidancy(election_id, name, description, candidate_fee).await;
}

async fn call_register_candidate(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id_and_candidate_id(&mut args, 
        |election_id, candidate_id, _| 
        interact.register_candidate(election_id, candidate_id)
    ).await;
}

async fn call_register_self(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    let election_id = args.next().expect("election id required");
    let election_id: u64 = election_id.parse().expect("invalid election id");
    let verification_data = args.next().expect("verification data required");
    
    interact.register_self(election_id, verification_data).await;
}

async fn call_register_voter(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    
    let election_id = args.next().expect("election id required");
    let election_id: u64 = election_id.parse().expect("invalid election id");
    
    let voter_address = args.next().expect("voter address required");
    
    interact.register_voter(election_id, voter_address).await;
}

async fn call_vote(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {

    let election_id = args.next().expect("election id required");
    let election_id: u64 = election_id.parse().expect("invalid election id");

    let votes: Vec<u16> = args.map(|arg| arg.parse().expect("invalid vote")).collect();

    
    interact.vote(election_id, votes).await;
}

async fn call_end_election(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    call_on_election_id(&mut args, |election_id, _| interact.end_election(election_id)).await;
}

async fn call_make_dispute(interact: &mut ContractInteract, mut args: std::str::SplitWhitespace<'_>) {
    

    let election_id = args.next().expect("election id required");
    let election_id: u64 = election_id.parse().expect("invalid election id");

    let dispute_name = args.next().expect("dispute name required");
    
    let dispute_description = args.next().expect("dispute description required");

    
    interact.make_dispute(election_id, dispute_name, dispute_description).await;
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

        interactor.set_current_dir_from_workspace("backendsc");
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
            "mxsc:../output/backendsc.mxsc.json",
            &InterpreterContext::default(),
        );

        ContractInteract {
            interactor,
            wallet_address,
            contract_code,
            state: State::load_state()
        }
    }

    pub async fn deploy(&mut self, candidate_fee: BigUint<StaticApi>) {

        let new_address = self
            .interactor
            .tx()
            .from(&self.wallet_address)
            .gas(300_000_000u64)
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

    pub async fn update_candidate_fee(&mut self, candidate_fee: BigUint<StaticApi>) {
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

    pub async fn election_data(&mut self, election_id: u64) {
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

    pub async fn registered_voters(&mut self, election_id: u64) {

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

    pub async fn potential_candidate_id_list(&mut self, election_id: u64) {

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

    pub async fn candidate_id_list(&mut self, election_id: u64) {

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

    pub async fn candidate(&mut self, election_id: u64, candidate_id: u16) {

        let result_value = self
            .interactor
            .query()
            .to(self.state.current_address())
            .typed(proxy::BackendScProxy)
            .candidate(election_id, candidate_id)
            .returns(ReturnsResultUnmanaged)
            .run()
            .await;

        println!("Result: {result_value:?}");
    }

    pub async fn votes(&mut self, election_id: u64) {

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

    pub async fn dispute_id_list(&mut self, election_id: u64) {

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

    pub async fn dispute(&mut self, election_id: u64, dispute_id: u16) {

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

    pub async fn result_vector(&mut self, election_id: u64, candidate_id: u16) {

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

    pub async fn results(&mut self, election_id: u64) {

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

    pub async fn register_election(&mut self, name: &str, description: &str, election_type: u64, start_time: u64, end_time: u64) {
        //let name = ManagedBuffer::new_from_bytes(&b""[..]);
        //let description = ManagedBuffer::new_from_bytes(&b""[..]);


        let name = ManagedBuffer::new_from_bytes(name.as_bytes());
        let description = ManagedBuffer::new_from_bytes(description.as_bytes());

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

    pub async fn submit_candidancy(&mut self, election_id: u64, name: &str, description: &str, egld_amount: BigUint<StaticApi>) {

        let name = ManagedBuffer::new_from_bytes(name.as_bytes());
        let description = ManagedBuffer::new_from_bytes(description.as_bytes());

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

    pub async fn register_candidate(&mut self, election_id: u64, candidate_id: u16) {

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

    pub async fn register_self(&mut self, election_id: u64, verification_data: &str) {
        let verification_data = ManagedBuffer::new_from_bytes(verification_data.as_bytes());

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

    pub async fn register_voter(&mut self, election_id: u64, voter_address: &str) {
        let voter_address = bech32::decode(voter_address);

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

    pub async fn vote(&mut self, election_id: u64, vote: Vec<u16>) {
        let vote = MultiValueVec::from(vote);

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

    pub async fn end_election(&mut self, election_id: u64) {

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

    pub async fn make_dispute(&mut self, election_id: u64, dispute_name: &str, dispute_description: &str) {

        let dispute_name = ManagedBuffer::new_from_bytes(dispute_name.as_bytes());
        let dispute_description = ManagedBuffer::new_from_bytes(dispute_description.as_bytes());

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
