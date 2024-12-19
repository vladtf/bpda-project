import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

interface VoteOption {
  candidateId: string;
  rating: number;
}

export const Vote = ({ callbackRoute }: WidgetProps) => {
  const [voterAddress, setVoterAddress] = useState<string>('');
  const [electionId, setElectionId] = useState<string>('');
  const [votes, setVotes] = useState<VoteOption[]>([{ candidateId: '', rating: 0 }]);
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

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

  const handleVoteChange = (index: number, field: string, value: string | number) => {
    const newVotes = [...votes];
    // @ts-ignore
    newVotes[index][field] = value;
    setVotes(newVotes);
  };

  const addVoteOption = () => {
    setVotes([...votes, { candidateId: '', rating: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Voter Address</Label>
          <input
            type='text'
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
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
        {votes.map((vote, index) => (
          <div key={index} className='flex flex-col gap-2'>
            <Label className='font-semibold'>Candidate ID {index + 1}</Label>
            <select
              value={vote.candidateId}
              onChange={(e) => handleVoteChange(index, 'candidateId', e.target.value)}
              className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            >
              <option value=''>Select Candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
            <Label className='font-semibold'>Rating</Label>
            <input
              type='number'
              value={vote.rating}
              onChange={(e) => handleVoteChange(index, 'rating', Number(e.target.value))}
              className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>
        ))}
        <Button type='button' onClick={addVoteOption} className='mt-2 bg-green-500 text-white p-2 rounded-md hover:bg-green-600'>
          Add Another Vote
        </Button>
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
      </OutputContainer>
    </div>
  );
};