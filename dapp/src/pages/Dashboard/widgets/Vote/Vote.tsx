import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useGetAccountInfo } from 'hooks';

interface VoteOption {
  candidateId: string;
  rating: number;
}

export const Vote = ({ callbackRoute }: WidgetProps) => {
  const { address: voterAddress } = useGetAccountInfo();
  const [electionId, setElectionId] = useState<string>('');
  const [votes, setVotes] = useState<VoteOption[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [includeValidated, setIncludeValidated] = useState<boolean>(true);
  const [hideNonValidated, setHideNonValidated] = useState<boolean>(true);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get('/elections', { baseURL: API_URL });
        setElections(res.data.elections);
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
          const res = await axios.get(`/candidates?electionId=${electionId}`, { baseURL: API_URL });
          setCandidates(res.data.candidates);
        } catch (error) {
          console.error('Error fetching candidates:', error);
        }
      }
    };

    fetchCandidates();
  }, [electionId]);

  const handleVoteChange = (candidateId: string, rating: number) => {
    const existingVote = votes.find(vote => vote.candidateId === candidateId);
    if (existingVote) {
      setVotes(votes.map(vote => vote.candidateId === candidateId ? { ...vote, rating } : vote));
    } else {
      setVotes([...votes, { candidateId, rating }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.post('/vote', {
        voter_address: voterAddress,
        electionId,
        votes
      }, {
        baseURL: API_URL
      });
      setResponse(res.data);
      console.log('Vote submitted:', res.data);
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      setError(error.response?.data?.error || 'Failed to submit vote. Please try again.');
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
              <option key={election.id} value={election.id}>
                {election.name}
              </option>
            ))}
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            checked={hideNonValidated}
            onChange={(e) => setHideNonValidated(e.target.checked)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <Label className='font-semibold'>Hide Non-Validated Candidates</Label>
        </div>
        {candidates
          .filter(candidate => !hideNonValidated || candidate.approved)
          .map((candidate) => (
            <div key={candidate.id} className='flex flex-col gap-2'>
              <Label className='font-semibold'>{candidate.name}</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  onChange={(e) => handleVoteChange(candidate.id, e.target.checked ? 1 : 0)}
                  className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  disabled={!candidate.approved}
                />
                <span className='text-gray-700'>{candidate.name} ({candidate.approved ? 'Validated' : 'Not Validated'})</span>
              </div>
              {votes.find(vote => vote.candidateId === candidate.id) && (
                <input
                  type='number'
                  value={votes.find(vote => vote.candidateId === candidate.id)?.rating || 0}
                  onChange={(e) => handleVoteChange(candidate.id, Number(e.target.value))}
                  className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              )}
            </div>
          ))}
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