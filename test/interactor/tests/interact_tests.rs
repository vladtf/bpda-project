use multiversx_sc_snippets::imports::*;
use rust_interact::ContractInteract;

// Simple deploy test that runs on the real blockchain configuration.
// In order for this test to work, make sure that the `config.toml` file contains the real blockchain config (or choose it manually)
// Can be run with `sc-meta test`.
#[tokio::test]
#[ignore = "run on demand, relies on real blockchain state"]
async fn deploy_test_test() {
    let mut interactor = ContractInteract::new().await;

    interactor.deploy().await;
}
