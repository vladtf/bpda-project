import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { Candidate, ElectionType, useSendElectionTransaction } from 'hooks';
import { SessionEnum } from 'localConstants';
import { BigIntValue, U16Value } from '@multiversx/sdk-core/out';

export const Vote = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [electionInfo, setElectionInfo] = useState<any>(null);
  const [electionType, setElectionType] = useState<ElectionType>('Approval');

  const {
    getElectionIdList,
    getCandidates,
    vote,
    getElectionData,
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
    const fetchCandidates = async () => {
      if (electionId) {
        try {
          const candidates = await getCandidates({ electionId });
          setCandidates(candidates);
        } catch (error) {
          console.error('Error fetching candidates:', error);
        }
      } else {
        setCandidates([]);
      }
    };

    fetchCandidates();
  }, [electionId]);

  useEffect(() => {
    const fetchElectionInfo = async () => {
      if (electionId) {
        try {
          const info = await getElectionData({ electionId });
          setElectionInfo(info);
          setElectionType(info?.election_type || 'Approval');
        } catch (error) {
          console.error('Error fetching election info:', error);
        }
      } else {
        setElectionInfo(null);
        setElectionType('Approval');
      }
    };

    fetchElectionInfo();
  }, [electionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      await vote({
        electionId,
        votes: selectedCandidates.map((candidateId) => new U16Value(candidateId))
      });
      setResponse('Vote submitted successfully');
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error submitting vote');
      console.error('Error submitting vote:', error);
    }
  };

  const handleCandidateSelection = (candidateId: number) => {
    if (electionType === 'Plurality') {
      setSelectedCandidates([candidateId]);
    } else {
      setSelectedCandidates((prevSelected) =>
        prevSelected.includes(candidateId)
          ? prevSelected.filter((id) => id !== candidateId)
          : [...prevSelected, candidateId]
      );
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
        {electionInfo && (
          <div className='flex flex-col gap-2'>
            <Label className='font-semibold'>Election Information</Label>
            <pre className='bg-gray-100 p-2 rounded-md'>{JSON.stringify(electionInfo, null, 2)}</pre>
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Candidates</Label>
          {candidates.map((candidate) => (
            <div key={candidate.id} className='flex items-center gap-2'>
              <input
                type={electionType === 'Plurality' ? 'radio' : 'checkbox'}
                id={`candidate-${candidate.id}`}
                checked={selectedCandidates.includes(candidate.id)}
                onChange={() => handleCandidateSelection(candidate.id)}
                className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <Label htmlFor={`candidate-${candidate.id}`} className='cursor-pointer'>
                {candidate.name}
              </Label>
            </div>
          ))}
        </div>
        <Button type='submit' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          Submit Vote
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