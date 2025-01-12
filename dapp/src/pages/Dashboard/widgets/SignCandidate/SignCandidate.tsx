import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';
import { useGetAccountInfo } from 'hooks';

export const SignCandidate = ({ callbackRoute }: WidgetProps) => {
  const { address: voterAddress } = useGetAccountInfo();
  const [electionId, setElectionId] = useState<string>('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const electionsRes = await axios.get('/elections', { baseURL: GATEWAY_URL });
        setElections(electionsRes.data.elections);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (electionId) {
        try {
          const res = await axios.get('/candidates', {
            params: { electionId },
            baseURL: GATEWAY_URL
          });
          setCandidates(res.data.candidates);
        } catch (error) {
          console.error('Error fetching candidates:', error);
        }
      }
    };

    fetchCandidates();
  }, [electionId]);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.post('/sign_candidate', {
        voter_address: voterAddress,
        electionId,
        candidateId
      }, {
        baseURL: GATEWAY_URL
      });
      setResponse(res.data);
      console.log('Candidate signed:', res.data);
    } catch (error: any) {
      console.error('Error signing candidate:', error);
      setError(error.response?.data?.error || 'Failed to sign candidate. Please try again.');
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSign} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Candidate ID</Label>
          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
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
        </div>
        <Button type='submit' className='mt-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600'>
          Sign Candidate
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