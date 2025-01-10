use test::*;
use multiversx_sc_scenario::imports::*;

const OWNER: TestAddress = TestAddress::new("owner");
const ADDER_ADDRESS: TestSCAddress = TestSCAddress::new("adder");
const CODE_PATH: MxscPath = MxscPath::new("mxsc:output/test.mxsc.json");

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();

    // blockchain.set_current_dir_from_workspace("relative path to your workspace, if applicable");
    blockchain.register_contract(CODE_PATH, test::ContractBuilder);
    blockchain
}

#[test]
fn adder_whitebox() {
    let mut world = world();

    world.account(OWNER).nonce(1);

    let new_address = world
        .tx()
        .from(OWNER)
        .raw_deploy()
        .code(CODE_PATH)
        .new_address(ADDER_ADDRESS)
        .returns(ReturnsNewBech32Address)
        .whitebox(test::contract_obj, |sc| {
            sc.init(BigUint::from(3u64));
        });

    assert_eq!(new_address, ADDER_ADDRESS.to_address().into());

    world
        .tx()
        .from(OWNER)
        .to(ADDER_ADDRESS)
        .whitebox(test::contract_obj, |sc| {
            sc.add(BigUint::from(5u64));
        });

    let _raw_response = world
        .query()
        .to(ADDER_ADDRESS)
        .returns(ReturnsRawResult)
        .whitebox(test::contract_obj, |sc| {
            let sum = sc.sum().get();
            assert_eq!(sum, BigUint::from(8u64));
        });
}
