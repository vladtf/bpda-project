
import { useState } from 'react';
import { Button } from 'components/Button';
import { Label } from 'components/Label';
import axios from 'axios';
import { API_URL } from 'config';
import { WidgetProps } from 'types';
import { OutputContainer } from 'components';

export const SignCandidate = ({ callbackRoute }: WidgetProps) => {
  const [voterAddress, setVoterAddress] = useState<string>('');
  const [electionId, setElectionId] = useState<string>('');
  const [candidateId, setCandidateId] = useState<string>('');
  const [response, setResponse] = useState<any>(null);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/sign_candidate', {
        voter_address: voterAddress,
        electionId,
        candidateId
      }, {
        baseURL: API_URL
      });
      setResponse(res.data);
      console.log('Candidate signed:', res.data);
    } catch (error) {
      console.error('Error signing candidate:', error);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <form onSubmit={handleSign} className='flex flex-col gap-4 p-4 bg-white shadow-md rounded-md'>
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
          <input
            type='text'
            value={electionId}
            onChange={(e) => setElectionId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label className='font-semibold'>Candidate ID</Label>
          <input
            type='text'
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className='input border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            required
          />
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
      </OutputContainer>
    </div>
  );
};