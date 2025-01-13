import { useState, useEffect } from 'react';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { SessionEnum } from 'localConstants';
import { useSendElectionTransaction } from 'hooks';

export const Explorer = ({ callbackRoute }: WidgetProps) => {
  const [elections, setElections] = useState<any>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [registeredCandidates, setRegisteredCandidates] = useState<any[]>([]);
  const [voters, setVoters] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    getElectionIdList,
    getElectionList,
    getPotentialCandidates,
    getCandidates,
    getRegisteredVoters,
    getDisputes
  } = useSendElectionTransaction({
    type: SessionEnum.abiElectionSessionId
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const electionList = await getElectionList();
      setElections(electionList);

      const potentialCandidatesList = await Promise.all(electionList.map(election => getPotentialCandidates({ electionId: election?.id })));
      setCandidates(potentialCandidatesList.flat());

      const registeredCandidatesList = await Promise.all(electionList.map(election => getCandidates({ electionId: election?.id })));
      setRegisteredCandidates(registeredCandidatesList.flat());

      const votersList = await Promise.all(electionList.map(election => getRegisteredVoters({ electionId: election?.id })));
      setVoters(votersList.flat());

      const disputesList = await Promise.all(electionList.map(election => getDisputes({ electionId: election?.id })));
      setDisputes(disputesList.flat());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className='flex flex-col gap-6'>
      <button onClick={fetchData} className='self-end px-4 py-2 bg-blue-500 text-white rounded-md'>
        Refresh
      </button>
      <OutputContainer className='max-h-192 overflow-y-auto' isLoading={isLoading}>
        {error && (
          <div className='rounded-md text-red-500'>
            <h3 className='font-semibold mb-2'>Error</h3>
            <p>{error}</p>
          </div>
        )}
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Elections</h3>
          <pre>{JSON.stringify(elections, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Potential Candidates</h3>
          <pre>{JSON.stringify(candidates, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Registered Candidates</h3>
          <pre>{JSON.stringify(registeredCandidates, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Voters</h3>
          <pre>{JSON.stringify(voters, null, 2)}</pre>
        </div>
        <div className='rounded-md'>
          <h3 className='font-semibold mb-2'>Disputes</h3>
          <pre>{JSON.stringify(disputes, null, 2)}</pre>
        </div>
      </OutputContainer>
    </div>
  );
};
