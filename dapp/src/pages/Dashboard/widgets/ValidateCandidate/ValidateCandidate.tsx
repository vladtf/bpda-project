import { useState, useEffect } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { GATEWAY_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const ValidateCandidate = ({ callbackRoute }: WidgetProps) => {
  const [electionId, setElectionId] = useState<string>('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await axios.get('/elections', { baseURL: GATEWAY_URL });
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
          const res = await axios.get(`/candidates?electionId=${electionId}`, { baseURL: GATEWAY_URL });
          setCandidates(res.data.candidates);
        } catch (error) {
          console.error('Error fetching candidates:', error);
        }
      }
    };

    fetchCandidates();
  }, [electionId]);

  const handleValidateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const res = await axios.post('/validate_candidate', { electionId, candidateId }, { baseURL: GATEWAY_URL });
      setResponse(res.data);
      console.log('Candidate validated:', res.data);
    } catch (error: any) {
      console.error('Error validating candidate:', error);
      setError(error.response?.data?.error || 'Failed to validate candidate. Please try again.');
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCandidateId(selectedId);
    const candidate = candidates.find((c) => c.id === selectedId);
    setSelectedCandidate(candidate);
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleValidateCandidate} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
            onChange={handleCandidateChange}
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
        {selectedCandidate && (
          <div className='mt-4 p-4 bg-gray-100 rounded-md'>
            <h4 className='font-semibold'>Candidate Information</h4>
            <p><strong>Name:</strong> {selectedCandidate.name}</p>
            <p><strong>Manifesto:</strong> {selectedCandidate.manifesto}</p>
            <p><strong>Sign Count:</strong> {selectedCandidate.sign_count}</p>
            <p><strong>Approved:</strong> {selectedCandidate.approved ? 'Yes' : 'No'}</p>
          </div>
        )}
        <Button type='submit' className='mt-4 bg-green-500 text-white p-2 rounded-md hover:bg-green-600'>
          Validate Candidate
        </Button>
      </form>
      <OutputContainer>
        {response && (
          <div className='rounded-md'>
            <h3 className='font-semibold mb-2'>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
            {response.sign_count !== undefined && (
              <p>Signatures Collected: {response.sign_count}</p>
            )}
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
