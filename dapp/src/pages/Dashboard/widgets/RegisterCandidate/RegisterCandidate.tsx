import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { Candidate, useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';

export const RegisterCandidate = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [potentialCandidates, setPotentialCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isElectionStarted, setIsElectionStarted] = useState<boolean>(false);

  const {
    getElectionIdList,
    getPotentialCandidates,
    getElectionData,
    registerCandidate
  } = useSendElectionTransaction({
    type: SessionEnum.abiElectionSessionId
  });

  useEffect(() => {
    const fetchElections = async () => {
      try {
        setElections(await getElectionIdList());
      } catch (error) {
        console.error('Error fetching elections:', error);
      }
    };

    fetchElections();
  }, []);

  useEffect(() => {
    const fetchPotentialCandidates = async () => {
      if (electionId) {
        try {
          const candidates = await getPotentialCandidates({ electionId });
          setPotentialCandidates(candidates);
        } catch (error) {
          console.error('Error fetching potential candidates:', error);
        }
      } else {
        setPotentialCandidates([]);
      }
    };

    const fetchElectionDetails = async () => {
      if (electionId) {
        try {
          const details = await getElectionData({ electionId });
          setIsElectionStarted(Date.now() >= details.start_time);
        } catch (error) {
          console.error('Error fetching election details:', error);
        }
      } else {
        setIsElectionStarted(false);
      }
    };

    fetchElectionDetails();
    fetchPotentialCandidates();
  }, [electionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state

    try {
      console.log('Registering candidate:', { electionId, candidateId });
      await registerCandidate({
        electionId,
        candidateId
      });
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error registering candidate');
      console.error('Error registering candidate:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Election ID</Label>
          <select
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          >
            <option value=''>Select Election</option>
            {elections.map((election) => (
              <option key={election} value={election}>
                {election}
              </option>
            ))}
          </select>
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Candidate Name</Label>
          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          >
            <option value=''>Select Candidate</option>
            {potentialCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </div>
        {isElectionStarted && (
          <div className='text-orange-500'>
            <strong>Note:</strong> This election has already started.
          </div>
        )}
        <Button type='submit' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          Register Candidate
        </Button>
      </form>
      <OutputContainer>
        {response && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
        {error && (
          <div className='rounded-md text-red-500'>
            <h3 className='font-semibold mb-2'>Error</h3>
            <p>{error}</p>
          </div>
        )}
      </OutputContainer>
    </div>
  );
};