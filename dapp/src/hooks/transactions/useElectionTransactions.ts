import { useState, useCallback } from 'react';
import {
  deleteTransactionToast,
  removeAllSignedTransactions,
  removeAllTransactionsToSign
} from '@multiversx/sdk-dapp/services/transactions/clearTransactions';
import { GATEWAY_URL, contractAddress } from 'config';
import { signAndSendTransactions } from 'helpers/signAndSendTransactions';
import {
  useGetAccountInfo,
  useGetNetworkConfig,
  useTrackTransactionStatus
} from 'hooks/sdkDappHooks';
import { GAS_PRICE, SessionEnum, VERSION } from 'localConstants';
import { getChainId } from 'utils/getChainId';
import { smartContract } from 'utils/smartContract';
import { Address, ProxyNetworkProvider } from 'utils/sdkDappCore';
import { AddressValue, BigIntValue, BigUIntValue, BooleanValue, Field, ResultsParser, StringValue, TypedValue, VariadicType, VariadicValue } from '@multiversx/sdk-core/out';

export type Candidate = {
  id: number;
  name: string;
  description: string;
  creator: string;
};

export type Dispute = {
  name: string;
  description: string;
  creator: string;
  resolved: boolean;
  result_adjusted: boolean;
};

export type ElectionData = {
  id: number;
  name: string;
  description: string;
  start_time: number;
  end_time: number;
  election_type: string;
  ended: boolean;
  admin: string;
};

export type ElectionType = 'Plurality' | 'Approval' | 'SingleTransferableVote';

export type Vote = {
  candidates: number[];
};


const REGISTER_ELECTION_INFO = {
  processingMessage: 'Processing Register Election transaction',
  errorMessage: 'An error has occured during Register Election',
  successMessage: 'Register Election transaction successful'
};

const SUBMIT_CANDIDANCY_INFO = {
  processingMessage: 'Processing Submit Candidancy transaction',
  errorMessage: 'An error has occured during Submit Candidancy',
  successMessage: 'Submit Candidancy transaction successful'
};

const REGISTER_CANDIDATE_INFO = {
  processingMessage: 'Processing Register Candidate transaction',
  errorMessage: 'An error has occured during Register Candidate',
  successMessage: 'Register Candidate transaction successful'
};

const REGISTER_SELF_INFO = {
  processingMessage: 'Processing Register Self transaction',
  errorMessage: 'An error has occured during Register Self',
  successMessage: 'Register Self transaction successful'
};

const REGISTER_VOTER_INFO = {
  processingMessage: 'Processing Register Voter transaction',
  errorMessage: 'An error has occured during Register Voter',
  successMessage: 'Register Voter transaction successful'
};

const VOTE_INFO = {
  processingMessage: 'Processing Vote transaction',
  errorMessage: 'An error has occured during Vote',
  successMessage: 'Vote transaction successful'
};

const END_ELECTION_INFO = {
  processingMessage: 'Processing End Election transaction',
  errorMessage: 'An error has occured during End Election',
  successMessage: 'End Election transaction successful'
};

const MAKE_DISPUTE_INFO = {
  processingMessage: 'Processing Make Dispute transaction',
  errorMessage: 'An error has occured during Make Dispute',
  successMessage: 'Make Dispute transaction successful'
};

export type ElectionTransactionProps = {
  type: SessionEnum;
};

export const useSendElectionTransaction = ({
  type
}: ElectionTransactionProps) => {
  // Needed in order to differentiate widgets between each other
  // By default sdk-dapp takes the last sessionId available which will display on every widget the same transaction
  // this usually appears on page refreshes
  const [electionSessionId, setElectionSessionId] = useState(
    sessionStorage.getItem(type)
  );

  const { network } = useGetNetworkConfig();
  const { address, account } = useGetAccountInfo();

  const transactionStatus = useTrackTransactionStatus({
    transactionId: electionSessionId ?? '0'
  });

  const clearAllTransactions = () => {
    removeAllSignedTransactions();
    removeAllTransactionsToSign();
    deleteTransactionToast(electionSessionId ?? '');
  };

  const getDisputeIDList = useCallback(
    async ({ electionId }: any) => {
      const args = [
        new BigUIntValue(electionId)
      ];

      const disputeIdList = await smartContract.methodsExplicit
        .getDisputeIDList(args)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(disputeIdList);
      let disputeIdListRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getDisputeIDList'));

      const mappedDisputeIdList = disputeIdListRes.values.map((value: any) => value.items.map((item: any) => item.value.toString())).flat();
      return mappedDisputeIdList;
    }, []
  );

  const getElectionList = useCallback(
    async () => {
      const electionList = await smartContract.methodsExplicit
        .electionList()
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(electionList);
      let electionListRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('electionList'));

      const mappedElectionList: ElectionData[] = electionListRes.values.map((value: any) => {
        const electionData = value.items.map((item: any) => item.value);
        return {
          id: '0',
          name: electionData[0].toString(),
          description: electionData[1].toString(),
          start_time: electionData[2].toBigInt() / 1000,
          end_time: electionData[3].toBigInt(),
          election_type: electionData[4].toString(),
          ended: electionData[5].toBoolean(),
          admin: electionData[6].toString()
        };
      });
      return mappedElectionList;
    }, []
  );

  const getPotentialCandidates = useCallback(
    async ({ electionId }: any) => {
      const potentialCandidateIds = await getPotentialCandidateIDs({ electionId });
      const candidates = await Promise.all(potentialCandidateIds.map(candidateId => getCandidate({ electionId, candidateId })));
      return candidates;
    }
    , []
  );

  const getCandidates = useCallback(
    async ({ electionId }: any) => {
      const candidateIds = await getCandidateIds({ electionId });
      const candidates = await Promise.all(candidateIds.map(candidateId => getCandidate({ electionId, candidateId })));
      return candidates;
    }, []
  );

  const getCandidateIds = useCallback(
    async ({ electionId }: any) => {
      const args = [
        new BigUIntValue(electionId)
      ];

      const candidateIds = await smartContract.methodsExplicit
        .getCandidateIDs(args)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(candidateIds);
      let candidateIdsRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getCandidateIDs'));

      const mappedCandidateIds = candidateIdsRes.values.map((value: any) => value.items.map((item: any) => item.value.toString())).flat();
      return mappedCandidateIds;
    }, []
  );

  const getPotentialCandidateIDs = useCallback(
    async ({ electionId }: any) => {
      const args = [
        new BigUIntValue(electionId)
      ];

      const potentialCandidateIDs = await smartContract.methodsExplicit
        .getPotentialCandidateIDs(args)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(potentialCandidateIDs);
      let potentialCandidateIDsRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getPotentialCandidateIDs'));

      const mappedPotentialCandidateIDs = potentialCandidateIDsRes.values.map((value: any) => value.items.map((item: any) => item.value.toString())).flat();
      return mappedPotentialCandidateIDs;
    }, []
  );

  const getCandidate = useCallback(
    async ({ electionId, candidateId }: any) => {
      const candidateDetails: TypedValue[] = [
        new BigUIntValue(electionId),
        new BigUIntValue(candidateId)
      ];

      const candidateData = await smartContract.methodsExplicit
        .getCandidate(candidateDetails)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(candidateData);
      let candidateDataRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getCandidate'));

      const candidateDataParsed: Candidate[] = candidateDataRes.values.map((value: any) => {
        const candidateData: Map<string, Field> = value.fieldsByName;
        return {
          name: candidateData.get('name')?.value.toString() ?? '',
          description: candidateData.get('description')?.value.toString() ?? '',
          creator: candidateData.get('creator')?.value.toString() ?? '',
          id: candidateId
        };
      });

      return candidateDataParsed[0];
    }, []
  );

  const getElectionData = useCallback(
    async ({ electionId }: any) => {
      const electionDetails: TypedValue[] = [
        new BigUIntValue(electionId)
      ];

      const electionData = await smartContract.methodsExplicit
        .getElectionData(electionDetails)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(electionData);


      let electionDataRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getElectionData'));

      const electionDataParsed = electionDataRes.values.map((value: any) => {
        const electionData: Map<string, Field> = value.fieldsByName;
        const start_time = electionData.get('start_time')?.value.valueOf().toNumber() * 1000;
        const end_time = electionData.get('end_time')?.value.valueOf().toNumber() * 1000;
        const election_type = electionData.get('election_type')?.value.valueOf().name as ElectionType;

        return {
          id: electionData.get('id')?.value.toString(),
          name: electionData.get('name')?.value.toString(),
          description: electionData.get('description')?.value.toString(),
          start_time: start_time,
          end_time: end_time,
          election_type: election_type,
          ended: electionData.get('ended')?.value.valueOf(),
          admin: electionData.get('admin')?.value.toString()
        };
      });

      console.log("Election Data Parsed: ", electionDataParsed);
      return electionDataParsed[0];
    }, []
  );


  const getElectionIdList = useCallback(
    async () => {
      const electionIdList = await smartContract.methodsExplicit
        .getElectionIDList()
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(electionIdList);
      let electionIdListRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getElectionIDList'));

      const mappedElectionIdList = electionIdListRes.values.map((value: any) => value.items.map((item: any) => item.value.toString())).flat();
      return mappedElectionIdList;
    }, []
  );

  const getElectionResults = useCallback(
    async ({ electionId }: { electionId: string }) => {
      const args = [
        new BigUIntValue(electionId)
      ];

      const electionResults = await smartContract.methodsExplicit
        .results(args)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(electionResults);
      let electionResultsRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('results'));

      const winnerCandidateId = electionResultsRes.values[0].valueOf().toNumber();
      const candidate = await getCandidate({ electionId, candidateId: winnerCandidateId });
      return candidate;
    }, []
  );

  const getCandidateFee = useCallback(
    async () => {
      const candidateFeeQuery = await smartContract.methodsExplicit
        .getCandidateFee()
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(candidateFeeQuery);
      let candidateFeeRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getCandidateFee'));

      let candidateFee = candidateFeeRes.firstValue?.valueOf().toString();
      console.log("Candidate Fee: ", candidateFee);

      return candidateFee;
    }, []);

  const getDispute = useCallback(
    async (electionId: string, disputeId: string) => {
      const args: TypedValue[] = [
        new BigUIntValue(electionId),
        new BigUIntValue(disputeId)
      ];

      const disputeQuery = await smartContract.methodsExplicit
        .getDispute(args)
        .buildQuery();

      const proxyNetworkProvider = new ProxyNetworkProvider(GATEWAY_URL);
      let queryResponse = await proxyNetworkProvider.queryContract(disputeQuery);
      let disputeRes = new ResultsParser().parseQueryResponse(queryResponse, smartContract.getEndpoint('getDispute'));

      const disputeData: Dispute[] = disputeRes.values.map((value: any) => {
        const disputeFields: Map<string, Field> = value.fieldsByName;
        return {
          name: disputeFields.get('name')?.value.toString() ?? '',
          description: disputeFields.get('description')?.value.toString() ?? '',
          creator: disputeFields.get('creator')?.value.toString() ?? '',
          // resolved: disputeFields.get('resolved')?.value.toBoolean() ?? false,
          // result_adjusted: disputeFields.get('result_adjusted')?.value.toBoolean() ?? false
        };
      }) ?? [];

      return disputeData[0];
    }, []
  );

  const registerElection = useCallback(
    async ({ name, description, election_type, start_time, end_time }: any) => {
      clearAllTransactions();

      const electionDetails: TypedValue[] = [
        new StringValue(name),
        new StringValue(description),
        new BigIntValue(election_type),
        new BigUIntValue(start_time / 1000),
        new BigUIntValue(end_time / 1000)
      ];

      const registerElection = smartContract.methodsExplicit
        .registerElection(electionDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [registerElection],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: REGISTER_ELECTION_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const submitCandidancy = useCallback(
    async ({ electionId, name, description, fee }: any) => {
      clearAllTransactions();

      const candidancyDetails: TypedValue[] = [
        new BigIntValue(electionId),
        new StringValue(name),
        new StringValue(description)
      ];

      const submitCandidancy = smartContract.methodsExplicit
        .submitCandidancy(candidancyDetails)
        .withSender(new Address(address))
        .withValue(new BigUIntValue(fee))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [submitCandidancy],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: SUBMIT_CANDIDANCY_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const registerCandidate = useCallback(
    async ({ electionId, candidateId }: any) => {
      clearAllTransactions();

      const candidateDetails: TypedValue[] = [
        new BigIntValue(electionId),
        new BigIntValue(candidateId)
      ];

      const registerCandidate = smartContract.methodsExplicit
        .registerCandidate(candidateDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [registerCandidate],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: REGISTER_CANDIDATE_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const registerSelf = useCallback(
    async ({ electionId, verification_data }: any) => {
      clearAllTransactions();

      const selfDetails: TypedValue[] = [
        new BigIntValue(electionId),
        new StringValue(verification_data)
      ];

      const registerSelf = smartContract.methodsExplicit
        .registerSelf(selfDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [registerSelf],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: REGISTER_SELF_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const registerVoter = useCallback(
    async ({ electionId, voter_address }: any) => {
      clearAllTransactions();

      const voterDetails: TypedValue[] = [
        new BigIntValue(electionId),
        new AddressValue(voter_address)
      ];

      const registerVoter = smartContract.methodsExplicit
        .registerVoter(voterDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [registerVoter],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: REGISTER_VOTER_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const vote = useCallback(
    async ({ electionId, votes }: any) => {
      clearAllTransactions();

      let voteDetails: TypedValue[] = [
        new BigIntValue(electionId)
      ];

      for (let i = 0; i < votes.length; i++) {
        voteDetails.push(new BigIntValue(votes[i]));
      }

      const voteTransaction = smartContract.methodsExplicit
        .vote(voteDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [voteTransaction],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: VOTE_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  // endElection
  const endElection = useCallback(
    async ({ electionId }: any) => {
      clearAllTransactions();

      const electionDetails: TypedValue[] = [
        new BigIntValue(electionId)
      ];

      const endElection = smartContract.methodsExplicit
        .endElection(electionDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [endElection],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: END_ELECTION_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  // makeDispute: electionId: u64, dispute_name: String, dispute_description: String
  const makeDispute = useCallback(
    async ({ electionId, dispute_name, dispute_description }: any) => {
      clearAllTransactions();

      const disputeDetails: TypedValue[] = [
        new BigIntValue(electionId),
        new StringValue(dispute_name),
        new StringValue(dispute_description)
      ];

      const makeDispute = smartContract.methodsExplicit
        .makeDispute(disputeDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [makeDispute],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: MAKE_DISPUTE_INFO
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  const resolveDispute = useCallback(
    async ({ electionId, disputeId, valid }: any) => {
      clearAllTransactions();

      const disputeDetails: TypedValue[] = [
        new BigUIntValue(electionId),
        new BigUIntValue(disputeId),
        new BooleanValue(valid)
      ];

      const resolveDispute = smartContract.methodsExplicit
        .resolveDispute(disputeDetails)
        .withSender(new Address(address))
        .withGasLimit(60000000)
        .withChainID(getChainId())
        .buildTransaction();

      const sessionId = await signAndSendTransactions({
        transactions: [resolveDispute],
        callbackRoute: '/dashboard',
        transactionsDisplayInfo: {
          processingMessage: 'Processing Resolve Dispute transaction',
          errorMessage: 'An error has occurred during Resolve Dispute',
          successMessage: 'Resolve Dispute transaction successful'
        }
      });

      sessionStorage.setItem(type, sessionId);
      setElectionSessionId(sessionId);
    }, []
  );

  return {
    getElectionIdList,
    getCandidateFee,
    getDisputeIDList,
    registerElection,
    submitCandidancy,
    getElectionList,
    getElectionData,
    getPotentialCandidates,
    getCandidates,
    getCandidate,
    registerCandidate,
    registerSelf,
    registerVoter,
    vote,
    endElection,
    makeDispute,
    transactionStatus,
    getElectionResults,
    getDispute,
    resolveDispute
  };
};
